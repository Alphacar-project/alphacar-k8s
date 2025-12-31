#!/bin/bash

# 문서를 각각의 S3 버킷에 업로드하는 스크립트
# - 보안 관련 문서: yaml 버킷의 documents/security/ 경로
# - S3 수명주기 정리: yaml 버킷의 documents/s3/ 경로
# - Elasticsearch 문서: yaml 버킷의 documents/elasticsearch/ 경로

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# AWS 계정 ID
ACCOUNT_ID="${ACCOUNT_ID:-382045063773}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

# 버킷 이름
MONGODB_BUCKET="mongodb-${ACCOUNT_ID}"
YAML_BUCKET="yaml-${ACCOUNT_ID}"
CARIMAGE_BUCKET="carimage-${ACCOUNT_ID}"

# 문서 디렉토리
DOCS_DIR="/home/alphacar/md"

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
log_info "문서를 S3 버킷에 업로드"
log_info "=========================================="
echo ""

# AWS CLI 확인
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI가 설치되어 있지 않습니다."
    exit 1
fi

# AWS 자격증명 로드
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    log_info "AWS 자격증명을 Secret에서 가져오는 중..."
    if [ -f "./load-aws-credentials.sh" ]; then
        source ./load-aws-credentials.sh
    else
        log_warning "load-aws-credentials.sh 파일을 찾을 수 없습니다."
        log_info "환경 변수로 AWS 자격증명을 설정하거나 Secret에서 로드하세요."
    fi
fi

# AWS 자격증명 확인
if ! aws sts get-caller-identity &>/dev/null; then
    log_error "AWS 자격증명이 설정되지 않았습니다."
    log_info "환경 변수 설정 또는 AWS CLI 설정을 확인하세요."
    exit 1
fi

log_info "AWS 계정 ID: $ACCOUNT_ID"
log_info "리전: $REGION"
echo ""

# 문서 디렉토리 확인
if [ ! -d "$DOCS_DIR" ]; then
    log_error "문서 디렉토리를 찾을 수 없습니다: $DOCS_DIR"
    exit 1
fi

# 버킷 존재 확인 및 업로드 함수
upload_to_bucket() {
    local bucket=$1
    local local_file=$2
    local s3_key=$3
    
    if [ ! -f "$local_file" ]; then
        log_warning "파일을 찾을 수 없습니다: $local_file"
        return 1
    fi
    
    # 버킷 존재 확인
    if ! aws s3 ls "s3://$bucket" &>/dev/null; then
        log_warning "버킷이 존재하지 않습니다: $bucket"
        log_info "버킷을 먼저 생성하세요: ./setup-s3-buckets.sh"
        return 1
    fi
    
    # 파일 업로드
    if aws s3 cp "$local_file" "s3://$bucket/$s3_key" --region "$REGION" 2>/dev/null; then
        log_success "업로드 완료: $s3_key → $bucket"
        return 0
    else
        log_error "업로드 실패: $local_file → s3://$bucket/$s3_key"
        return 1
    fi
}

# 1. 보안 관련 문서 → yaml 버킷
log_info "1. 보안 관련 문서 업로드 중..."
SECURITY_DOCS=(
    "POD-SECURITY-STATUS.md"
    "POD-SECURITY-STATUS.csv"
    "ISTIO-NETWORKPOLICY-정리.md"
    "보안정책_발표자료.md"
)

for doc in "${SECURITY_DOCS[@]}"; do
    if [ -f "$DOCS_DIR/$doc" ]; then
        upload_to_bucket "$YAML_BUCKET" "$DOCS_DIR/$doc" "documents/security/$doc"
    else
        log_warning "파일을 찾을 수 없습니다: $doc"
    fi
done

echo ""

# 2. S3 수명주기 정리 → yaml 버킷
log_info "2. S3 수명주기 정리 문서 업로드 중..."
if [ -f "$DOCS_DIR/S3-수명주기-정리.md" ]; then
    upload_to_bucket "$YAML_BUCKET" "$DOCS_DIR/S3-수명주기-정리.md" "documents/s3/S3-수명주기-정리.md"
else
    log_warning "파일을 찾을 수 없습니다: S3-수명주기-정리.md"
fi

echo ""

# 3. Elasticsearch 문서는 제외 (Elasticsearch가 직접 사용하므로 S3 백업 불필요)
# log_info "3. Elasticsearch 문서 업로드 중..."
# Elasticsearch는 실시간 동기화를 사용하므로 S3 백업 불필요

echo ""

# 업로드 요약
log_info "=========================================="
log_success "문서 업로드 완료!"
log_info "=========================================="
echo ""

log_info "업로드된 문서 위치:"
log_info ""
log_info "YAML 버킷 ($YAML_BUCKET):"
log_info "  - documents/security/POD-SECURITY-STATUS.md"
log_info "  - documents/security/POD-SECURITY-STATUS.csv"
log_info "  - documents/security/ISTIO-NETWORKPOLICY-정리.md"
log_info "  - documents/security/보안정책_발표자료.md"
log_info "  - documents/s3/S3-수명주기-정리.md"
echo ""

log_info "문서 확인 방법:"
log_info "  aws s3 ls s3://$YAML_BUCKET/documents/ --recursive"
echo ""

