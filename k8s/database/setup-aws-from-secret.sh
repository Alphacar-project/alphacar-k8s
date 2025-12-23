#!/bin/bash

# Secret에서 AWS 자격증명을 가져와서 환경 변수로 설정하고
# AWS CLI 설치 및 S3 버킷 설정을 자동으로 진행하는 스크립트

set -e

NAMESPACE="apc-backup-ns"
SECRET_NAME="cloud-credentials"
CONFIGMAP_NAME="velero-aws-config"

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
log_info "Secret에서 AWS 자격증명 설정"
log_info "=========================================="
echo ""

# Step 1: Secret에서 자격증명 추출
log_info "Step 1: Secret에서 AWS 자격증명 추출 중..."

if ! kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &>/dev/null; then
    log_error "Secret을 찾을 수 없습니다: $SECRET_NAME"
    exit 1
fi

# credentials 파일 내용 가져오기
CREDENTIALS=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o jsonpath='{.data.cloud}' | base64 -d)

# AWS 자격증명 추출
AWS_ACCESS_KEY_ID=$(echo "$CREDENTIALS" | grep -E "^aws_access_key_id" | sed 's/.*= *//' | tr -d ' ' | tr -d '\r')
AWS_SECRET_ACCESS_KEY=$(echo "$CREDENTIALS" | grep -E "^aws_secret_access_key" | sed 's/.*= *//' | tr -d ' ' | tr -d '\r')

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    log_error "자격증명을 추출할 수 없습니다."
    exit 1
fi

log_success "자격증명 추출 완료"
log_info "  Access Key ID: ${AWS_ACCESS_KEY_ID:0:10}..."
echo ""

# Step 2: 환경 변수로 설정
log_info "Step 2: 환경 변수 설정 중..."
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

log_success "환경 변수 설정 완료"
echo ""

# Step 3: AWS CLI 설치 확인 및 설치
log_info "Step 3: AWS CLI 설치 확인 중..."

if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version 2>&1)
    log_success "AWS CLI가 이미 설치되어 있습니다: $AWS_VERSION"
else
    log_warning "AWS CLI가 설치되어 있지 않습니다."
    log_info "설치를 시도합니다..."
    
    # apt로 설치 시도
    if command -v apt &> /dev/null; then
        log_info "apt를 사용하여 설치 시도 중..."
        if sudo apt update && sudo apt install -y awscli 2>/dev/null; then
            log_success "AWS CLI 설치 완료"
        else
            log_warning "apt 설치 실패. 다른 방법을 시도합니다..."
            
            # snap으로 설치 시도
            if command -v snap &> /dev/null; then
                log_info "snap을 사용하여 설치 시도 중..."
                if sudo snap install aws-cli --classic 2>/dev/null; then
                    log_success "AWS CLI 설치 완료"
                else
                    log_error "AWS CLI 설치 실패"
                    log_info "수동으로 설치하세요:"
                    log_info "  sudo apt install -y awscli"
                    log_info "  또는"
                    log_info "  sudo snap install aws-cli --classic"
                    exit 1
                fi
            else
                log_error "AWS CLI 설치 실패. 수동으로 설치하세요."
                exit 1
            fi
        fi
    else
        log_error "apt를 찾을 수 없습니다. 수동으로 AWS CLI를 설치하세요."
        exit 1
    fi
fi

echo ""

# Step 4: AWS 자격증명 확인
log_info "Step 4: AWS 자격증명 확인 중..."

if aws sts get-caller-identity &>/dev/null; then
    IDENTITY=$(aws sts get-caller-identity)
    log_success "AWS 자격증명 확인 완료"
    log_info "  Account: $(echo "$IDENTITY" | grep -o '"Account": "[^"]*' | cut -d'"' -f4)"
    log_info "  User: $(echo "$IDENTITY" | grep -o '"Arn": "[^"]*' | cut -d'"' -f4)"
else
    log_error "AWS 자격증명 확인 실패"
    log_info "환경 변수가 올바르게 설정되었는지 확인하세요."
    exit 1
fi

echo ""

# Step 5: ConfigMap에서 S3 설정 읽기
log_info "Step 5: S3 설정 확인 중..."

if kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" &>/dev/null; then
    S3_BUCKET=$(kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" -o jsonpath='{.data.S3_BUCKET}')
    S3_REGION=$(kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" -o jsonpath='{.data.S3_REGION}')
    S3_PREFIX=$(kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" -o jsonpath='{.data.S3_PREFIX}')
    
    log_success "S3 설정 확인 완료"
    log_info "  버킷: $S3_BUCKET"
    log_info "  리전: $S3_REGION"
    log_info "  Prefix: $S3_PREFIX"
else
    log_warning "ConfigMap을 찾을 수 없습니다. 기본값을 사용합니다."
    S3_BUCKET="${S3_BUCKET:-velero-backups}"
    S3_REGION="${S3_REGION:-us-east-1}"
    S3_PREFIX="${S3_PREFIX:-apc-backup}"
fi

echo ""

# Step 6: S3 버킷 확인 및 생성
log_info "Step 6: S3 버킷 확인 및 설정 중..."

if aws s3 ls "s3://$S3_BUCKET" &>/dev/null; then
    log_success "S3 버킷이 이미 존재합니다: $S3_BUCKET"
else
    log_info "S3 버킷 생성 중..."
    
    # 버킷 생성
    if [ "$S3_REGION" = "us-east-1" ]; then
        # us-east-1은 LocationConstraint가 필요 없음
        if aws s3api create-bucket --bucket "$S3_BUCKET" --region "$S3_REGION" 2>/dev/null; then
            log_success "S3 버킷 생성 완료: $S3_BUCKET"
        else
            log_error "S3 버킷 생성 실패"
            exit 1
        fi
    else
        if aws s3api create-bucket \
            --bucket "$S3_BUCKET" \
            --region "$S3_REGION" \
            --create-bucket-configuration LocationConstraint="$S3_REGION" 2>/dev/null; then
            log_success "S3 버킷 생성 완료: $S3_BUCKET"
        else
            log_error "S3 버킷 생성 실패"
            exit 1
        fi
    fi
fi

# 버전 관리 활성화
log_info "버전 관리 활성화 중..."
aws s3api put-bucket-versioning \
    --bucket "$S3_BUCKET" \
    --versioning-configuration Status=Enabled \
    --region "$S3_REGION" 2>/dev/null || log_warning "버전 관리 활성화 실패 (이미 활성화되었을 수 있음)"

# 암호화 설정
log_info "서버 측 암호화 설정 중..."
aws s3api put-bucket-encryption \
    --bucket "$S3_BUCKET" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }' \
    --region "$S3_REGION" 2>/dev/null || log_warning "암호화 설정 실패 (이미 설정되었을 수 있음)"

# 디렉터리 구조 생성
log_info "백업 디렉터리 구조 생성 중..."
aws s3api put-object \
    --bucket "$S3_BUCKET" \
    --key "${S3_PREFIX}/yaml-files/.keep" \
    --body /dev/null \
    --region "$S3_REGION" 2>/dev/null || true

log_success "S3 버킷 설정 완료!"

echo ""
log_info "=========================================="
log_success "모든 설정 완료!"
log_info "=========================================="
echo ""

log_info "설정 요약:"
log_info "  AWS CLI: 설치됨"
log_info "  AWS 자격증명: Secret에서 설정됨"
log_info "  S3 버킷: $S3_BUCKET"
log_info "  S3 리전: $S3_REGION"
log_info ""
log_info "다음 단계:"
log_info "  1. 백업 테스트: ./backup-all.sh"
log_info "  2. 백업 상태 확인: kubectl get backups -n $NAMESPACE"
log_info "  3. Schedule 확인: kubectl get schedule -n $NAMESPACE"


