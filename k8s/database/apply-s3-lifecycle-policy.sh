#!/bin/bash

# S3 버킷에 수명주기 정책 적용 스크립트
# 업데이트된 정책을 실제 S3 버킷에 적용합니다.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

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
log_info "S3 버킷 수명주기 정책 적용"
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

# Step 4: 각 버킷에 정책 적용
BUCKETS=("MongoDB" "VeleroBackup" "Carimage")

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
    
    # 버킷 존재 확인
    if ! aws s3 ls "s3://$BUCKET_NAME" &>/dev/null; then
        log_warning "버킷이 존재하지 않습니다: $BUCKET_NAME"
        log_info "버킷을 먼저 생성하세요: ./setup-s3-buckets.sh"
        continue
    fi
    
    # 기존 정책 확인
    log_info "기존 수명주기 정책 확인 중..."
    if aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" --region "$REGION" &>/dev/null; then
        log_warning "기존 수명주기 정책이 존재합니다."
        echo ""
        log_info "기존 정책:"
        aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" --region "$REGION" | jq '.' 2>/dev/null || aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" --region "$REGION"
        echo ""
    else
        log_info "기존 수명주기 정책이 없습니다."
    fi
    
    # 새 정책 적용
    log_info "새 수명주기 정책 적용 중..."
    
    # 임시 라이프사이클 정책 파일 생성
    TEMP_LIFECYCLE=$(mktemp)
    jq -r ".${BUCKET_TYPE}.lifecycle" "$CONFIG_FILE" > "$TEMP_LIFECYCLE"
    
    if aws s3api put-bucket-lifecycle-configuration \
        --bucket "$BUCKET_NAME" \
        --lifecycle-configuration "file://$TEMP_LIFECYCLE" \
        --region "$REGION" 2>/dev/null; then
        log_success "수명주기 정책 적용 완료"
    else
        log_error "수명주기 정책 적용 실패"
        rm -f "$TEMP_LIFECYCLE"
        continue
    fi
    
    rm -f "$TEMP_LIFECYCLE"
    
    # 적용된 정책 확인
    log_info "적용된 수명주기 정책 확인 중..."
    if aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" --region "$REGION" &>/dev/null; then
        log_success "수명주기 정책 확인 완료"
        echo ""
        log_info "적용된 정책:"
        aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" --region "$REGION" | jq '.' 2>/dev/null || aws s3api get-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" --region "$REGION"
    else
        log_warning "수명주기 정책을 확인할 수 없습니다."
    fi
    
    echo ""
    log_success "$BUCKET_TYPE 버킷 정책 적용 완료: $BUCKET_NAME"
    echo ""
done

echo ""
log_info "=========================================="
log_success "모든 버킷 정책 적용 완료!"
log_info "=========================================="
echo ""

log_info "적용된 정책 요약:"
log_info ""
log_info "1. MongoDB 백업 (데이터 분석용, 2년 보존):"
log_info "   - 0-7일: STANDARD 유지"
log_info "   - 30일 후: STANDARD_IA로 이동"
log_info "   - 180일 후: GLACIER로 이동"
log_info "   - 365일 후: DEEP_ARCHIVE로 이동"
log_info "   - 730일 후: 삭제 (2년)"
log_info ""
log_info "2. Velero 백업 (재해 복구용, 6개월 보존):"
log_info "   - 0-7일: STANDARD 유지"
log_info "   - 30일 후: STANDARD_IA로 이동"
log_info "   - 90일 후: GLACIER로 이동"
log_info "   - 150일 후: DEEP_ARCHIVE로 이동"
log_info "   - 180일 후: 삭제 (6개월)"
log_info ""
log_info "3. 차량 이미지 (신차 출시 주기 2년, 2년 보존):"
log_info "   - 0-30일: STANDARD 유지"
log_info "   - 30일 후: STANDARD_IA로 이동"
log_info "   - 365일 후: GLACIER로 이동"
log_info "   - 730일 후: 삭제 (2년)"
echo ""

log_info "참고:"
log_info "  - 수명주기 정책은 매일 자동으로 실행됩니다."
log_info "  - 정책 변경 사항은 최대 24시간 내에 적용될 수 있습니다."
log_info "  - Glacier 및 Deep Archive로 이동된 객체는 복원 시 추가 비용이 발생할 수 있습니다."

