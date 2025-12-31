#!/bin/bash

# yaml 버킷을 velero-backup 버킷으로 이름 변경 (내용 복사 후 기존 버킷 삭제)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# AWS 계정 ID
ACCOUNT_ID="${ACCOUNT_ID:-382045063773}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

# 버킷 이름
OLD_BUCKET="yaml-${ACCOUNT_ID}"
NEW_BUCKET="velero-backup-${ACCOUNT_ID}"

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
log_info "S3 버킷 이름 변경: yaml → velero-backup"
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
    fi
fi

# AWS 자격증명 확인
if ! aws sts get-caller-identity &>/dev/null; then
    log_error "AWS 자격증명이 설정되지 않았습니다."
    exit 1
fi

log_info "기존 버킷: $OLD_BUCKET"
log_info "새 버킷: $NEW_BUCKET"
log_info "리전: $REGION"
echo ""

# 기존 버킷 존재 확인
if ! aws s3 ls "s3://$OLD_BUCKET" &>/dev/null; then
    log_error "기존 버킷을 찾을 수 없습니다: $OLD_BUCKET"
    exit 1
fi

log_success "기존 버킷 확인 완료: $OLD_BUCKET"
echo ""

# Step 1: 새 버킷 생성
log_info "Step 1: 새 버킷 생성 중..."
if aws s3 ls "s3://$NEW_BUCKET" &>/dev/null; then
    log_warning "새 버킷이 이미 존재합니다: $NEW_BUCKET"
    read -p "기존 버킷을 사용하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "작업을 취소했습니다."
        exit 1
    fi
else
    log_info "버킷 생성 중: $NEW_BUCKET"
    if [ "$REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$NEW_BUCKET" --region "$REGION"
    else
        aws s3api create-bucket \
            --bucket "$NEW_BUCKET" \
            --region "$REGION" \
            --create-bucket-configuration LocationConstraint="$REGION"
    fi
    
    if [ $? -eq 0 ]; then
        log_success "버킷 생성 완료: $NEW_BUCKET"
    else
        log_error "버킷 생성 실패: $NEW_BUCKET"
        exit 1
    fi
fi

echo ""

# Step 2: 버전 관리 활성화
log_info "Step 2: 버전 관리 활성화 중..."
aws s3api put-bucket-versioning \
    --bucket "$NEW_BUCKET" \
    --versioning-configuration Status=Enabled \
    --region "$REGION" 2>/dev/null || log_warning "버전 관리 활성화 실패 (이미 활성화되었을 수 있음)"

# Step 3: 암호화 설정
log_info "Step 3: 서버 측 암호화 설정 중..."
aws s3api put-bucket-encryption \
    --bucket "$NEW_BUCKET" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }' \
    --region "$REGION" 2>/dev/null || log_warning "암호화 설정 실패 (이미 설정되었을 수 있음)"

echo ""

# Step 4: 기존 버킷의 내용을 새 버킷으로 복사
log_info "Step 4: 기존 버킷의 내용을 새 버킷으로 복사 중..."
log_warning "이 작업은 시간이 걸릴 수 있습니다..."

if aws s3 sync "s3://$OLD_BUCKET" "s3://$NEW_BUCKET" --region "$REGION" --delete 2>/dev/null; then
    log_success "내용 복사 완료"
else
    log_error "내용 복사 실패"
    exit 1
fi

echo ""

# Step 5: 복사 확인
log_info "Step 5: 복사 확인 중..."
OLD_COUNT=$(aws s3 ls "s3://$OLD_BUCKET" --recursive 2>/dev/null | wc -l)
NEW_COUNT=$(aws s3 ls "s3://$NEW_BUCKET" --recursive 2>/dev/null | wc -l)

log_info "기존 버킷 파일 수: $OLD_COUNT"
log_info "새 버킷 파일 수: $NEW_COUNT"

if [ "$OLD_COUNT" -eq "$NEW_COUNT" ]; then
    log_success "복사 확인 완료: 모든 파일이 복사되었습니다."
else
    log_warning "파일 수가 일치하지 않습니다. 수동으로 확인하세요."
fi

echo ""

# Step 6: 기존 버킷 삭제 확인
log_warning "=========================================="
log_warning "기존 버킷 삭제 확인"
log_warning "=========================================="
log_warning "기존 버킷($OLD_BUCKET)을 삭제하시겠습니까?"
log_warning "주의: 이 작업은 되돌릴 수 없습니다!"
read -p "삭제하시겠습니까? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "기존 버킷 삭제 중..."
    
    # 버킷 비우기
    log_info "버킷 비우기 중..."
    if aws s3 rm "s3://$OLD_BUCKET" --recursive --region "$REGION" 2>/dev/null; then
        log_success "버킷 비우기 완료"
    else
        log_warning "버킷 비우기 실패 (이미 비어있을 수 있음)"
    fi
    
    # 버킷 삭제
    log_info "버킷 삭제 중..."
    if aws s3api delete-bucket --bucket "$OLD_BUCKET" --region "$REGION" 2>/dev/null; then
        log_success "버킷 삭제 완료: $OLD_BUCKET"
    else
        log_warning "버킷 삭제 실패 (버전 관리된 객체가 있을 수 있음)"
        log_info "수동으로 버킷을 삭제하세요: aws s3api delete-bucket --bucket $OLD_BUCKET"
    fi
else
    log_info "기존 버킷을 유지합니다: $OLD_BUCKET"
    log_info "수동으로 삭제하려면: aws s3 rm s3://$OLD_BUCKET --recursive && aws s3api delete-bucket --bucket $OLD_BUCKET"
fi

echo ""

# Step 7: ConfigMap 업데이트
log_info "Step 7: ConfigMap 업데이트 중..."
NAMESPACE="apc-backup-ns"

if kubectl get configmap velero-aws-config -n "$NAMESPACE" &>/dev/null; then
    kubectl patch configmap velero-aws-config -n "$NAMESPACE" --type merge -p "{
        \"data\": {
            \"S3_BUCKET_YAML\": \"${NEW_BUCKET}\"
        }
    }" && log_success "ConfigMap 업데이트 완료" || log_warning "ConfigMap 업데이트 실패"
else
    log_warning "ConfigMap을 찾을 수 없습니다: velero-aws-config"
fi

echo ""

log_info "=========================================="
log_success "버킷 이름 변경 완료!"
log_info "=========================================="
echo ""

log_info "새 버킷: $NEW_BUCKET"
log_info "기존 버킷: $OLD_BUCKET (삭제 여부 확인 필요)"
echo ""

log_info "다음 단계:"
log_info "  1. 새 버킷의 내용 확인: aws s3 ls s3://$NEW_BUCKET --recursive"
log_info "  2. 기존 버킷이 삭제되지 않았다면 수동으로 삭제"
log_info "  3. CloudWatch 비활성화: ./disable-s3-cloudwatch.sh"
echo ""




