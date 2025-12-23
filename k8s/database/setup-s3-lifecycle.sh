#!/bin/bash

# S3 라이프사이클 정책 설정 스크립트
# Velero 백업의 자동 아카이빙 및 삭제를 관리합니다.

set -e

NAMESPACE="apc-backup-ns"
CONFIGMAP_NAME="velero-aws-config"
LIFECYCLE_POLICY_FILE="s3-lifecycle-policy.json"

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
log_info "S3 라이프사이클 정책 설정"
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
    
    # Secret에서 자격증명 추출
    SECRET_NAME="cloud-credentials"
    if kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &>/dev/null; then
        CREDENTIALS=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o jsonpath='{.data.cloud}' | base64 -d)
        AWS_ACCESS_KEY_ID=$(echo "$CREDENTIALS" | grep -E "^aws_access_key_id" | sed 's/.*= *//' | tr -d ' ' | tr -d '\r')
        AWS_SECRET_ACCESS_KEY=$(echo "$CREDENTIALS" | grep -E "^aws_secret_access_key" | sed 's/.*= *//' | tr -d ' ' | tr -d '\r')
        
        if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
            export AWS_ACCESS_KEY_ID
            export AWS_SECRET_ACCESS_KEY
            export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
            log_success "Secret에서 자격증명을 가져와서 환경 변수로 설정했습니다."
        else
            log_error "Secret에서 자격증명을 추출할 수 없습니다."
            log_info "수동 설정 방법: ./setup-aws-from-secret.sh"
            exit 1
        fi
    else
        log_error "Secret을 찾을 수 없습니다: $SECRET_NAME"
        log_info "설정 방법: ./setup-aws-from-secret.sh"
        exit 1
    fi
fi

# 자격증명 재확인
if ! aws sts get-caller-identity &>/dev/null; then
    log_error "AWS 자격증명 확인 실패"
    exit 1
fi

log_success "AWS CLI 및 자격증명 확인 완료"
echo ""

# Step 3: ConfigMap에서 S3 버킷 정보 읽기
log_info "Step 1: S3 버킷 정보 확인 중..."

if kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" &>/dev/null; then
    S3_BUCKET=$(kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" -o jsonpath='{.data.S3_BUCKET}')
    S3_PREFIX=$(kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" -o jsonpath='{.data.S3_PREFIX}')
else
    log_warning "ConfigMap을 찾을 수 없습니다. 기본값을 사용합니다."
    S3_BUCKET="${S3_BUCKET:-velero-backups}"
    S3_PREFIX="${S3_PREFIX:-apc-backup}"
fi

log_info "S3 설정:"
log_info "  버킷: $S3_BUCKET"
log_info "  Prefix: $S3_PREFIX"
echo ""

# Step 4: 라이프사이클 정책 파일 확인
log_info "Step 2: 라이프사이클 정책 파일 확인 중..."

if [ ! -f "$LIFECYCLE_POLICY_FILE" ]; then
    log_error "라이프사이클 정책 파일을 찾을 수 없습니다: $LIFECYCLE_POLICY_FILE"
    exit 1
fi

log_success "라이프사이클 정책 파일 확인 완료"
echo ""

# Step 5: 라이프사이클 정책 내용 표시
log_info "Step 3: 라이프사이클 정책 내용:"
echo ""
cat "$LIFECYCLE_POLICY_FILE" | jq '.' 2>/dev/null || cat "$LIFECYCLE_POLICY_FILE"
echo ""

# Step 6: 기존 라이프사이클 정책 확인
log_info "Step 4: 기존 라이프사이클 정책 확인 중..."

if aws s3api get-bucket-lifecycle-configuration --bucket "$S3_BUCKET" &>/dev/null; then
    log_warning "기존 라이프사이클 정책이 존재합니다."
    echo ""
    log_info "기존 정책:"
    aws s3api get-bucket-lifecycle-configuration --bucket "$S3_BUCKET" | jq '.' 2>/dev/null || aws s3api get-bucket-lifecycle-configuration --bucket "$S3_BUCKET"
    echo ""
    read -p "기존 정책을 덮어쓰시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "작업을 취소했습니다."
        exit 0
    fi
else
    log_info "기존 라이프사이클 정책이 없습니다. 새로 생성합니다."
fi

echo ""

# Step 7: 라이프사이클 정책 적용
log_info "Step 5: 라이프사이클 정책 적용 중..."

# Prefix를 실제 값으로 대체
TEMP_POLICY=$(mktemp)
sed "s|apc-backup/|${S3_PREFIX}/|g" "$LIFECYCLE_POLICY_FILE" > "$TEMP_POLICY"

if aws s3api put-bucket-lifecycle-configuration \
    --bucket "$S3_BUCKET" \
    --lifecycle-configuration "file://$TEMP_POLICY"; then
    log_success "라이프사이클 정책 적용 완료"
else
    log_error "라이프사이클 정책 적용 실패"
    rm -f "$TEMP_POLICY"
    exit 1
fi

rm -f "$TEMP_POLICY"

echo ""

# Step 8: 적용된 정책 확인
log_info "Step 6: 적용된 라이프사이클 정책 확인 중..."

if aws s3api get-bucket-lifecycle-configuration --bucket "$S3_BUCKET" &>/dev/null; then
    log_success "라이프사이클 정책 확인 완료"
    echo ""
    log_info "적용된 정책:"
    aws s3api get-bucket-lifecycle-configuration --bucket "$S3_BUCKET" | jq '.' 2>/dev/null || aws s3api get-bucket-lifecycle-configuration --bucket "$S3_BUCKET"
else
    log_warning "라이프사이클 정책을 확인할 수 없습니다."
fi

echo ""
log_info "=========================================="
log_success "라이프사이클 정책 설정 완료!"
log_info "=========================================="
echo ""

log_info "라이프사이클 정책 요약:"
log_info ""
log_info "1. Velero 백업 (apc-backup/):"
log_info "   - 30일 후: STANDARD_IA로 이동"
log_info "   - 90일 후: GLACIER로 이동"
log_info "   - 180일 후: DEEP_ARCHIVE로 이동"
log_info "   - 365일 후: 삭제"
log_info ""
log_info "2. YAML 파일 (apc-backup/yaml-files/):"
log_info "   - 90일 후: STANDARD_IA로 이동"
log_info "   - 180일 후: GLACIER로 이동"
log_info "   - 730일 후: 삭제"
log_info ""
log_info "3. 버전 관리:"
log_info "   - 30일 후: STANDARD_IA로 이동"
log_info "   - 90일 후: GLACIER로 이동"
log_info "   - 180일 후: 삭제"
echo ""

log_info "참고:"
log_info "  - 라이프사이클 정책은 매일 자동으로 실행됩니다."
log_info "  - 정책 변경 사항은 최대 24시간 내에 적용될 수 있습니다."
log_info "  - Glacier 및 Deep Archive로 이동된 객체는 복원 시 추가 비용이 발생할 수 있습니다."

