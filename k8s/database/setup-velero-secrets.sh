#!/bin/bash

# Velero AWS 자격증명 Secret 생성 스크립트

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

log_info "Velero AWS 자격증명 Secret 생성"

# 기존 Secret 확인
if kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &>/dev/null; then
    log_warning "Secret이 이미 존재합니다: $SECRET_NAME"
    read -p "기존 Secret을 덮어쓰시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "작업을 취소했습니다."
        exit 0
    fi
    kubectl delete secret "$SECRET_NAME" -n "$NAMESPACE"
fi

# 방법 1: AWS credentials 파일 사용
if [ -f ~/.aws/credentials ]; then
    log_info "AWS credentials 파일을 사용하여 Secret 생성..."
    kubectl create secret generic "$SECRET_NAME" \
        --namespace "$NAMESPACE" \
        --from-file=cloud=~/.aws/credentials \
        --dry-run=client -o yaml | kubectl apply -f -
    
    if [ $? -eq 0 ]; then
        log_success "Secret 생성 완료 (credentials 파일 사용)"
        exit 0
    fi
fi

# 방법 2: 환경 변수 사용
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    log_info "환경 변수를 사용하여 Secret 생성..."
    
    # 임시 credentials 파일 생성
    TEMP_CREDS=$(mktemp)
    cat > "$TEMP_CREDS" <<EOF
[default]
aws_access_key_id = ${AWS_ACCESS_KEY_ID}
aws_secret_access_key = ${AWS_SECRET_ACCESS_KEY}
EOF
    
    kubectl create secret generic "$SECRET_NAME" \
        --namespace "$NAMESPACE" \
        --from-file=cloud="$TEMP_CREDS" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    rm -f "$TEMP_CREDS"
    
    if [ $? -eq 0 ]; then
        log_success "Secret 생성 완료 (환경 변수 사용)"
        exit 0
    fi
fi

# 방법 3: 수동 입력
log_info "AWS 자격증명을 수동으로 입력하세요:"
read -sp "AWS Access Key ID: " AWS_ACCESS_KEY_ID
echo
read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    log_error "자격증명이 입력되지 않았습니다."
    exit 1
fi

# 임시 credentials 파일 생성
TEMP_CREDS=$(mktemp)
cat > "$TEMP_CREDS" <<EOF
[default]
aws_access_key_id = ${AWS_ACCESS_KEY_ID}
aws_secret_access_key = ${AWS_SECRET_ACCESS_KEY}
EOF

kubectl create secret generic "$SECRET_NAME" \
    --namespace "$NAMESPACE" \
    --from-file=cloud="$TEMP_CREDS" \
    --dry-run=client -o yaml | kubectl apply -f -

rm -f "$TEMP_CREDS"

if [ $? -eq 0 ]; then
    log_success "Secret 생성 완료"
else
    log_error "Secret 생성 실패"
    exit 1
fi

log_info "Secret 확인:"
kubectl get secret "$SECRET_NAME" -n "$NAMESPACE"



