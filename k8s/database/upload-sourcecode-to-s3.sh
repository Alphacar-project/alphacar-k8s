#!/bin/bash

# alphacar-final의 k8s와 dev 디렉토리를 S3 버킷에 업로드하는 스크립트
# - k8s 디렉토리: velero-backup 버킷의 k8s/ 경로
# - dev 디렉토리: velero-backup 버킷의 dev/ 경로
# - 기존 documents/ 경로의 파일들은 삭제

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# AWS 계정 ID
ACCOUNT_ID="${ACCOUNT_ID:-382045063773}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

# 버킷 이름 (yaml 버킷을 velero-backup으로 사용)
# 참고: 버킷 이름을 velero-backup-${ACCOUNT_ID}로 변경 예정이지만, 현재는 yaml 버킷 사용
BUCKET_NAME="yaml-${ACCOUNT_ID}"

# 소스코드 디렉토리
SOURCE_DIR="/home/alphacar/alphacar-final"

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
log_info "소스코드를 S3 버킷에 업로드"
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
log_info "버킷: $BUCKET_NAME"
echo ""

# 소스코드 디렉토리 확인
if [ ! -d "$SOURCE_DIR" ]; then
    log_error "소스코드 디렉토리를 찾을 수 없습니다: $SOURCE_DIR"
    exit 1
fi

# 버킷 존재 확인
if ! aws s3 ls "s3://$BUCKET_NAME" &>/dev/null; then
    log_error "버킷이 존재하지 않습니다: $BUCKET_NAME"
    log_info "버킷을 먼저 생성하세요: ./setup-s3-buckets.sh"
    exit 1
fi

# Step 1: 기존 documents/ 경로의 파일들 삭제
log_info "Step 1: 기존 documents/ 경로의 파일들 삭제 중..."
if aws s3 ls "s3://$BUCKET_NAME/documents/" &>/dev/null; then
    if aws s3 rm "s3://$BUCKET_NAME/documents/" --recursive --region "$REGION" 2>/dev/null; then
        log_success "기존 documents/ 경로 파일 삭제 완료"
    else
        log_warning "기존 documents/ 경로 파일 삭제 실패 (없을 수도 있음)"
    fi
else
    log_info "기존 documents/ 경로가 없습니다 (건너뜀)"
fi

echo ""

# Step 2: k8s 디렉토리 업로드
log_info "Step 2: k8s 디렉토리 업로드 중..."
if [ -d "$SOURCE_DIR/k8s" ]; then
    if aws s3 sync "$SOURCE_DIR/k8s" "s3://$BUCKET_NAME/k8s/" \
        --region "$REGION" \
        --exclude "*.git/*" \
        --exclude "*.gitignore" \
        --exclude "node_modules/*" \
        --exclude "*.log" \
        --exclude ".DS_Store" \
        --delete 2>/dev/null; then
        log_success "k8s 디렉토리 업로드 완료"
    else
        log_error "k8s 디렉토리 업로드 실패"
        exit 1
    fi
else
    log_error "k8s 디렉토리를 찾을 수 없습니다: $SOURCE_DIR/k8s"
    exit 1
fi

echo ""

# Step 3: dev 디렉토리 업로드
log_info "Step 3: dev 디렉토리 업로드 중..."
if [ -d "$SOURCE_DIR/dev" ]; then
    if aws s3 sync "$SOURCE_DIR/dev" "s3://$BUCKET_NAME/dev/" \
        --region "$REGION" \
        --exclude "*.git/*" \
        --exclude "*.gitignore" \
        --exclude "node_modules/*" \
        --exclude "*.log" \
        --exclude ".DS_Store" \
        --exclude "dist/*" \
        --exclude "build/*" \
        --exclude ".next/*" \
        --delete 2>/dev/null; then
        log_success "dev 디렉토리 업로드 완료"
    else
        log_error "dev 디렉토리 업로드 실패"
        exit 1
    fi
else
    log_error "dev 디렉토리를 찾을 수 없습니다: $SOURCE_DIR/dev"
    exit 1
fi

echo ""

# 업로드 요약
log_info "=========================================="
log_success "소스코드 업로드 완료!"
log_info "=========================================="
echo ""

log_info "업로드된 디렉토리:"
log_info ""
log_info "버킷: $BUCKET_NAME"
log_info "  - k8s/ (Kubernetes 설정 파일)"
log_info "  - dev/ (개발 소스코드)"
echo ""

log_info "업로드 확인 방법:"
log_info "  aws s3 ls s3://$BUCKET_NAME/k8s/ --recursive | head -20"
log_info "  aws s3 ls s3://$BUCKET_NAME/dev/ --recursive | head -20"
echo ""

log_info "다운로드 방법:"
log_info "  aws s3 sync s3://$BUCKET_NAME/k8s/ ./k8s/"
log_info "  aws s3 sync s3://$BUCKET_NAME/dev/ ./dev/"
echo ""

log_info "참고: AWS OpenSearch를 사용하지 않으므로 Elasticsearch 관련 문서는 업로드하지 않습니다."
log_info "참고: 현재는 yaml 버킷을 사용하며, 향후 velero-backup-${ACCOUNT_ID}로 변경 예정입니다."
echo ""

