#!/bin/bash

# MongoDB의 차량 이미지 URL을 다운로드하여 S3에 업로드하고
# MongoDB의 URL을 S3 URL로 업데이트하는 스크립트

set -e

# 스크립트 디렉터리 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 설정
# 주의: MongoDB는 클러스터 내부 서비스이므로 로컬에서 접근하려면 포트 포워딩이 필요합니다.
# 포트 포워딩: kubectl port-forward -n apc-db-ns svc/mongodb 27017:27017
# 또는 Kubernetes Job으로 실행: kubectl apply -f migrate-car-images-job.yaml
MONGODB_URI="${MONGODB_URI:-mongodb://triple_user:triple_password@localhost:27017/triple_db?authSource=admin}"
MONGODB_DB="${MONGODB_DB:-triple_db}"
NAMESPACE="apc-backup-ns"
CONFIGMAP_NAME="velero-aws-config"
S3_BUCKET="${S3_BUCKET:-carimage-382045063773}"
S3_PREFIX="${S3_PREFIX:-images}"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info "=========================================="
log_info "차량 이미지 S3 마이그레이션"
log_info "=========================================="
echo ""

# Step 1: AWS 자격증명 확인
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI가 설치되어 있지 않습니다."
    exit 1
fi

if ! aws sts get-caller-identity &>/dev/null; then
    log_warning "AWS 자격증명이 설정되어 있지 않습니다."
    if [ -f "./load-aws-credentials.sh" ]; then
        source ./load-aws-credentials.sh
    else
        log_error "AWS 자격증명을 설정하세요."
        exit 1
    fi
fi

# ConfigMap에서 S3 버킷 정보 읽기
if kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" &>/dev/null; then
    CONFIG_BUCKET=$(kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" -o jsonpath='{.data.S3_BUCKET_CARIMAGE}')
    if [ -n "$CONFIG_BUCKET" ] && [ "$CONFIG_BUCKET" != "null" ]; then
        S3_BUCKET="$CONFIG_BUCKET"
    fi
fi

log_info "설정:"
log_info "  MongoDB URI: ${MONGODB_URI%%@*}"
log_info "  데이터베이스: $MONGODB_DB"
log_info "  S3 버킷: $S3_BUCKET"
log_info "  S3 Prefix: $S3_PREFIX"
echo ""

# Step 2: Python 스크립트 생성 (MongoDB에서 이미지 URL 추출 및 다운로드)
PYTHON_SCRIPT=$(cat <<'PYTHON_EOF'
import sys
import os
import pymongo
import requests
import boto3
from urllib.parse import urlparse
from pathlib import Path
import hashlib
import json

# 설정
MONGODB_URI = os.environ.get('MONGODB_URI')
MONGODB_DB = os.environ.get('MONGODB_DB', 'triple_db')
S3_BUCKET = os.environ.get('S3_BUCKET')
S3_PREFIX = os.environ.get('S3_PREFIX', 'images')
AWS_REGION = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')

# MongoDB 연결
client = pymongo.MongoClient(MONGODB_URI)
db = client[MONGODB_DB]

# S3 클라이언트
s3_client = boto3.client('s3', region_name=AWS_REGION)

# 이미지 URL 필드 찾기 (컬렉션과 필드명은 실제 구조에 맞게 수정 필요)
# 예시: vehicles 컬렉션의 image_url 필드
collections_to_check = ['vehicles', 'cars', 'car_info', 'vehicle_info']

def download_image(url, s3_key):
    """이미지를 다운로드하여 S3에 업로드"""
    try:
        response = requests.get(url, timeout=30, stream=True)
        response.raise_for_status()
        
        # S3에 업로드
        s3_client.upload_fileobj(
            response.raw,
            S3_BUCKET,
            s3_key,
            ExtraArgs={'ContentType': response.headers.get('Content-Type', 'image/jpeg')}
        )
        return True
    except Exception as e:
        print(f"이미지 다운로드 실패 ({url}): {str(e)}", file=sys.stderr)
        return False

def get_s3_url(s3_key):
    """S3 URL 생성"""
    return f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"

def process_collection(collection_name):
    """컬렉션의 이미지 URL을 처리"""
    if collection_name not in db.list_collection_names():
        return 0, 0
    
    collection = db[collection_name]
    total = collection.count_documents({})
    processed = 0
    updated = 0
    
    print(f"\n컬렉션: {collection_name} (총 {total}개 문서)")
    
    # 이미지 URL 필드 찾기 (실제 필드명에 맞게 수정 필요)
    image_fields = ['image_url', 'imageUrl', 'image', 'img_url', 'photo_url', 'photoUrl']
    
    for doc in collection.find({}):
        processed += 1
        doc_id = doc.get('_id')
        
        # 이미지 URL 필드 찾기
        image_url = None
        image_field = None
        for field in image_fields:
            if field in doc and doc[field]:
                image_url = doc[field]
                image_field = field
                break
        
        if not image_url or not isinstance(image_url, str):
            continue
        
        # 이미 S3 URL인 경우 스킵
        if 's3.amazonaws.com' in image_url or image_url.startswith('https://'):
            if S3_BUCKET in image_url:
                continue
        
        # 이미지 파일명 생성
        parsed_url = urlparse(image_url)
        file_ext = Path(parsed_url.path).suffix or '.jpg'
        file_hash = hashlib.md5(image_url.encode()).hexdigest()[:8]
        s3_key = f"{S3_PREFIX}/{collection_name}/{file_hash}{file_ext}"
        
        # 이미지 다운로드 및 S3 업로드
        if download_image(image_url, s3_key):
            # S3 URL 생성
            s3_url = get_s3_url(s3_key)
            
            # MongoDB 업데이트
            collection.update_one(
                {'_id': doc_id},
                {'$set': {image_field: s3_url}}
            )
            updated += 1
            print(f"  [{processed}/{total}] 업데이트: {doc_id} -> {s3_url}")
        else:
            print(f"  [{processed}/{total}] 실패: {doc_id}")
    
    return processed, updated

# 메인 처리
total_processed = 0
total_updated = 0

for collection_name in collections_to_check:
    processed, updated = process_collection(collection_name)
    total_processed += processed
    total_updated += updated

print(f"\n완료: {total_processed}개 처리, {total_updated}개 업데이트")
PYTHON_EOF
)

# Step 3: Python 스크립트를 임시 파일로 저장
TEMP_SCRIPT=$(mktemp)
echo "$PYTHON_SCRIPT" > "$TEMP_SCRIPT"

log_info "Python 스크립트 생성 완료"
log_warning "주의: 이 스크립트는 예시입니다."
log_warning "실제 MongoDB 컬렉션 구조와 이미지 URL 필드명에 맞게 수정이 필요합니다."
echo ""

log_info "필요한 Python 패키지:"
log_info "  pip install pymongo requests boto3"
echo ""

log_info "실행 방법:"
log_info "  1. Python 환경 설정:"
log_info "     export MONGODB_URI='$MONGODB_URI'"
log_info "     export MONGODB_DB='$MONGODB_DB'"
log_info "     export S3_BUCKET='$S3_BUCKET'"
log_info "     export S3_PREFIX='$S3_PREFIX'"
log_info "     export AWS_ACCESS_KEY_ID='...'"
log_info "     export AWS_SECRET_ACCESS_KEY='...'"
log_info "     export AWS_DEFAULT_REGION='us-east-1'"
log_info ""
log_info "  2. 스크립트 실행:"
log_info "     python3 $TEMP_SCRIPT"
echo ""

read -p "지금 실행하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Python 스크립트 실행 중..."
    
    # Python 확인
    if ! command -v python3 &> /dev/null; then
        log_error "Python3가 설치되어 있지 않습니다."
        exit 1
    fi
    
    # 가상 환경 생성 및 사용
    VENV_DIR="$SCRIPT_DIR/.venv-carimage"
    
    if [ ! -d "$VENV_DIR" ]; then
        log_info "가상 환경 생성 중..."
        if ! python3 -m venv "$VENV_DIR" 2>/dev/null; then
            log_error "가상 환경 생성 실패"
            log_info "python3-venv 패키지가 필요합니다:"
            log_info "  sudo apt install -y python3-venv"
            log_info ""
            log_info "설치 후 다시 스크립트를 실행하세요."
            exit 1
        fi
        log_success "가상 환경 생성 완료"
    fi
    
    # 가상 환경 활성화
    if [ ! -f "$VENV_DIR/bin/activate" ]; then
        log_error "가상 환경이 올바르게 생성되지 않았습니다."
        log_info "가상 환경을 삭제하고 다시 생성하세요:"
        log_info "  rm -rf $VENV_DIR"
        exit 1
    fi
    
    source "$VENV_DIR/bin/activate"
    
    # 패키지 설치 확인 및 설치
    if ! python3 -c "import pymongo, requests, boto3" 2>/dev/null; then
        log_warning "필요한 Python 패키지가 설치되어 있지 않습니다."
        log_info "가상 환경에 패키지 설치 중..."
        
        # 가상 환경의 pip 사용
        "$VENV_DIR/bin/pip" install --quiet --upgrade pip || true
        "$VENV_DIR/bin/pip" install pymongo requests boto3 || {
            log_error "패키지 설치 실패"
            deactivate 2>/dev/null || true
            exit 1
        }
        
        log_success "패키지 설치 완료"
    fi
    
    # 환경 변수 설정
    export MONGODB_URI
    export MONGODB_DB
    export S3_BUCKET
    export S3_PREFIX
    
    # 스크립트 실행
    python3 "$TEMP_SCRIPT"
    EXIT_CODE=$?
    
    # 가상 환경 비활성화
    deactivate 2>/dev/null || true
    
    if [ $EXIT_CODE -eq 0 ]; then
        log_success "이미지 마이그레이션 완료"
    else
        log_error "이미지 마이그레이션 실패"
        exit 1
    fi
else
    log_info "스크립트를 저장했습니다: $TEMP_SCRIPT"
    log_info "나중에 실행하려면 위의 환경 변수를 설정한 후 실행하세요."
fi

rm -f "$TEMP_SCRIPT"

log_success "작업 완료!"

