#!/bin/bash

# AWS S3 버킷 생성 및 설정 스크립트
# Velero 백업을 위한 S3 버킷을 생성하고 설정합니다.

set -e

# ConfigMap에서 설정 읽기
NAMESPACE="apc-backup-ns"
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

# AWS CLI 확인
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI가 설치되어 있지 않습니다."
    log_info "설치 방법: https://aws.amazon.com/cli/"
    exit 1
fi

# AWS 자격증명 확인
if ! aws sts get-caller-identity &>/dev/null; then
    log_error "AWS 자격증명이 설정되어 있지 않습니다."
    log_info "AWS 자격증명 설정 방법:"
    log_info "  1. aws configure"
    log_info "  2. 또는 환경 변수: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
    exit 1
fi

log_success "AWS CLI 및 자격증명 확인 완료"

# ConfigMap에서 설정 읽기
if kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" &>/dev/null; then
    S3_BUCKET=$(kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" -o jsonpath='{.data.S3_BUCKET}')
    S3_REGION=$(kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" -o jsonpath='{.data.S3_REGION}')
    S3_PREFIX=$(kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" -o jsonpath='{.data.S3_PREFIX}')
else
    log_warning "ConfigMap을 찾을 수 없습니다. 기본값을 사용합니다."
    S3_BUCKET="${S3_BUCKET:-velero-backups}"
    S3_REGION="${S3_REGION:-us-east-1}"
    S3_PREFIX="${S3_PREFIX:-apc-backup}"
fi

log_info "S3 설정:"
log_info "  버킷: $S3_BUCKET"
log_info "  리전: $S3_REGION"
log_info "  Prefix: $S3_PREFIX"

# 버킷 존재 확인
if aws s3 ls "s3://$S3_BUCKET" &>/dev/null; then
    log_success "S3 버킷이 이미 존재합니다: $S3_BUCKET"
else
    log_info "S3 버킷 생성 중..."
    
    # 버킷 생성
    if [ "$S3_REGION" = "us-east-1" ]; then
        # us-east-1은 LocationConstraint가 필요 없음
        aws s3api create-bucket --bucket "$S3_BUCKET" --region "$S3_REGION"
    else
        aws s3api create-bucket \
            --bucket "$S3_BUCKET" \
            --region "$S3_REGION" \
            --create-bucket-configuration LocationConstraint="$S3_REGION"
    fi
    
    if [ $? -eq 0 ]; then
        log_success "S3 버킷 생성 완료: $S3_BUCKET"
    else
        log_error "S3 버킷 생성 실패"
        exit 1
    fi
fi

# 버전 관리 활성화
log_info "버전 관리 활성화 중..."
aws s3api put-bucket-versioning \
    --bucket "$S3_BUCKET" \
    --versioning-configuration Status=Enabled \
    --region "$S3_REGION"

if [ $? -eq 0 ]; then
    log_success "버전 관리 활성화 완료"
else
    log_warning "버전 관리 활성화 실패 (이미 활성화되었을 수 있음)"
fi

# 암호화 설정 (선택사항)
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

# 버킷 정책 설정 (Velero 접근 권한)
log_info "버킷 정책 설정 중..."

cat > /tmp/velero-bucket-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${S3_BUCKET}",
                "arn:aws:s3:::${S3_BUCKET}/*"
            ]
        }
    ]
}
EOF

# 주의: 실제 프로덕션 환경에서는 더 제한적인 정책을 사용해야 합니다.
# 여기서는 Velero가 사용할 수 있도록 기본 정책을 설정합니다.

aws s3api put-bucket-policy \
    --bucket "$S3_BUCKET" \
    --policy file:///tmp/velero-bucket-policy.json \
    --region "$S3_REGION" 2>/dev/null || log_warning "버킷 정책 설정 실패 (이미 설정되었을 수 있음)"

rm -f /tmp/velero-bucket-policy.json

# 디렉터리 구조 생성
log_info "백업 디렉터리 구조 생성 중..."
aws s3api put-object \
    --bucket "$S3_BUCKET" \
    --key "${S3_PREFIX}/yaml-files/.keep" \
    --body /dev/null \
    --region "$S3_REGION" 2>/dev/null || true

log_success "S3 버킷 설정 완료!"
log_info ""
log_info "버킷 정보:"
log_info "  이름: $S3_BUCKET"
log_info "  리전: $S3_REGION"
log_info "  Prefix: $S3_PREFIX"
log_info ""
log_info "다음 단계:"
log_info "  1. cloud-credentials Secret 생성"
log_info "  2. Velero BackupStorageLocation 업데이트"
log_info "  3. 백업 테스트 실행"



