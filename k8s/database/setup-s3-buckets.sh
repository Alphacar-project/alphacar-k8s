#!/bin/bash

# 3개의 S3 버킷 생성 및 라이프사이클 정책 설정 스크립트
# - MongoDB: MongoDB 데이터 백업용
# - Yaml: YAML 파일 백업용
# - Carimage: 차량 이미지 저장용

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NAMESPACE="apc-backup-ns"
CONFIG_FILE="s3-buckets-lifecycle.json"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

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
log_info "S3 버킷 생성 및 라이프사이클 설정"
log_info "=========================================="
echo ""

# Step 1: AWS CLI 확인
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI가 설치되어 있지 않습니다."
    log_info "설치 방법: ./install-aws-cli.sh 또는 ./setup-aws-from-secret.sh"
    exit 1
fi

# Step 2: AWS 자격증명 확인 및 설정
if ! aws sts get-caller-identity &>/dev/null; then
    log_warning "AWS 자격증명이 환경 변수에 설정되어 있지 않습니다."
    log_info "Secret에서 자격증명을 가져오는 중..."
    
    if [ -f "./load-aws-credentials.sh" ]; then
        source ./load-aws-credentials.sh
    else
        log_error "load-aws-credentials.sh를 찾을 수 없습니다."
        exit 1
    fi
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
log_success "AWS CLI 및 자격증명 확인 완료 (Account: $ACCOUNT_ID)"
echo ""

# Step 3: 설정 파일 확인
if [ ! -f "$CONFIG_FILE" ]; then
    log_error "설정 파일을 찾을 수 없습니다: $CONFIG_FILE"
    exit 1
fi

log_success "설정 파일 확인 완료"
echo ""

# Step 4: 각 버킷 생성 및 설정
BUCKETS=("MongoDB" "Yaml" "Carimage")

for BUCKET_TYPE in "${BUCKETS[@]}"; do
    log_info "=========================================="
    log_info "처리 중: $BUCKET_TYPE"
    log_info "=========================================="
    echo ""
    
    # 버킷 이름 추출
    BUCKET_NAME=$(jq -r ".${BUCKET_TYPE}.bucket" "$CONFIG_FILE")
    if [ "$BUCKET_NAME" = "null" ] || [ -z "$BUCKET_NAME" ]; then
        log_error "버킷 이름을 찾을 수 없습니다: $BUCKET_TYPE"
        continue
    fi
    
    # Account ID 추가 (고유성 보장)
    BUCKET_NAME="${BUCKET_NAME}-${ACCOUNT_ID}"
    
    log_info "버킷 이름: $BUCKET_NAME"
    log_info "리전: $REGION"
    echo ""
    
    # 버킷 존재 확인 및 생성
    if aws s3 ls "s3://$BUCKET_NAME" &>/dev/null; then
        log_warning "버킷이 이미 존재합니다: $BUCKET_NAME"
    else
        log_info "버킷 생성 중..."
        if [ "$REGION" = "us-east-1" ]; then
            aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
        else
            aws s3api create-bucket \
                --bucket "$BUCKET_NAME" \
                --region "$REGION" \
                --create-bucket-configuration LocationConstraint="$REGION"
        fi
        
        if [ $? -eq 0 ]; then
            log_success "버킷 생성 완료: $BUCKET_NAME"
        else
            log_error "버킷 생성 실패: $BUCKET_NAME"
            continue
        fi
    fi
    
    # 버전 관리 활성화
    log_info "버전 관리 활성화 중..."
    aws s3api put-bucket-versioning \
        --bucket "$BUCKET_NAME" \
        --versioning-configuration Status=Enabled \
        --region "$REGION" 2>/dev/null || log_warning "버전 관리 활성화 실패 (이미 활성화되었을 수 있음)"
    
    # 암호화 설정
    log_info "서버 측 암호화 설정 중..."
    aws s3api put-bucket-encryption \
        --bucket "$BUCKET_NAME" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }' \
        --region "$REGION" 2>/dev/null || log_warning "암호화 설정 실패 (이미 설정되었을 수 있음)"
    
    # 라이프사이클 정책 설정
    log_info "라이프사이클 정책 설정 중..."
    
    # 임시 라이프사이클 정책 파일 생성
    TEMP_LIFECYCLE=$(mktemp)
    jq -r ".${BUCKET_TYPE}.lifecycle" "$CONFIG_FILE" > "$TEMP_LIFECYCLE"
    
    if aws s3api put-bucket-lifecycle-configuration \
        --bucket "$BUCKET_NAME" \
        --lifecycle-configuration "file://$TEMP_LIFECYCLE" \
        --region "$REGION" 2>/dev/null; then
        log_success "라이프사이클 정책 설정 완료"
    else
        log_error "라이프사이클 정책 설정 실패"
        rm -f "$TEMP_LIFECYCLE"
        continue
    fi
    
    rm -f "$TEMP_LIFECYCLE"
    
    # 라이프사이클 정책 확인
    log_info "라이프사이클 정책 확인 중..."
    if aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" &>/dev/null; then
        log_success "라이프사이클 정책 확인 완료"
    else
        log_warning "라이프사이클 정책을 확인할 수 없습니다."
    fi
    
    echo ""
    log_success "$BUCKET_TYPE 버킷 설정 완료: $BUCKET_NAME"
    echo ""
done

# Step 5: ConfigMap 업데이트
log_info "=========================================="
log_info "ConfigMap 업데이트"
log_info "=========================================="
echo ""

MONGODB_BUCKET="mongodb-${ACCOUNT_ID}"
YAML_BUCKET="yaml-${ACCOUNT_ID}"
CARIMAGE_BUCKET="carimage-${ACCOUNT_ID}"

if kubectl get configmap velero-aws-config -n "$NAMESPACE" &>/dev/null; then
    log_info "ConfigMap 업데이트 중..."
    kubectl patch configmap velero-aws-config -n "$NAMESPACE" --type merge -p "{
        \"data\": {
            \"S3_BUCKET_MONGODB\": \"${MONGODB_BUCKET}\",
            \"S3_BUCKET_YAML\": \"${YAML_BUCKET}\",
            \"S3_BUCKET_CARIMAGE\": \"${CARIMAGE_BUCKET}\"
        }
    }" && log_success "ConfigMap 업데이트 완료" || log_warning "ConfigMap 업데이트 실패"
else
    log_warning "ConfigMap을 찾을 수 없습니다. 수동으로 설정하세요."
fi

echo ""
log_info "=========================================="
log_success "모든 버킷 설정 완료!"
log_info "=========================================="
echo ""

log_info "생성된 버킷:"
log_info "  1. MongoDB 백업: $MONGODB_BUCKET"
log_info "  2. YAML 파일: $YAML_BUCKET"
log_info "  3. 차량 이미지: $CARIMAGE_BUCKET"
echo ""

log_info "라이프사이클 정책 요약:"
log_info ""
log_info "1. MongoDB 백업:"
log_info "   - 7일 후: STANDARD 유지 (빠른 복원)"
log_info "   - 30일 후: STANDARD_IA로 이동"
log_info "   - 90일 후: GLACIER로 이동"
log_info "   - 180일 후: DEEP_ARCHIVE로 이동"
log_info "   - 365일 후: 삭제"
log_info ""
log_info "2. YAML 파일:"
log_info "   - 30일 후: STANDARD_IA로 이동"
log_info "   - 180일 후: GLACIER로 이동"
log_info "   - 730일 후: 삭제"
log_info ""
log_info "3. 차량 이미지:"
log_info "   - 90일 후: STANDARD_IA로 이동"
log_info "   - 365일 후: GLACIER로 이동"
log_info "   - 1095일 후: 삭제 (3년)"
echo ""

log_info "다음 단계:"
log_info "  1. Velero BackupStorageLocation을 MongoDB 버킷으로 업데이트"
log_info "  2. YAML 백업 스크립트를 YAML 버킷으로 업데이트"
log_info "  3. 차량 이미지 업로드 스크립트 작성"

