#!/bin/bash

# Velero 백업 설정 완전 자동화 스크립트
# ConfigMap, Secret, S3 버킷을 모두 설정합니다.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NAMESPACE="apc-backup-ns"

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
log_info "Velero 백업 설정 자동화"
log_info "=========================================="
echo ""

# Step 1: 네임스페이스 확인
log_info "Step 1: 네임스페이스 확인"
if ! kubectl get namespace "$NAMESPACE" &>/dev/null; then
    log_error "네임스페이스가 없습니다: $NAMESPACE"
    log_info "먼저 namespaces.yaml을 적용하세요: kubectl apply -f namespaces.yaml"
    exit 1
fi
log_success "네임스페이스 확인 완료"
echo ""

# Step 2: ConfigMap 생성
log_info "Step 2: AWS 설정 ConfigMap 생성"
if kubectl apply -f velero-aws-config.yaml; then
    log_success "ConfigMap 생성 완료"
else
    log_error "ConfigMap 생성 실패"
    exit 1
fi
echo ""

# Step 3: Secret 생성
log_info "Step 3: AWS 자격증명 Secret 생성"
if [ -f "./setup-velero-secrets.sh" ]; then
    chmod +x ./setup-velero-secrets.sh
    ./setup-velero-secrets.sh
    if [ $? -eq 0 ]; then
        log_success "Secret 생성 완료"
    else
        log_warning "Secret 생성 실패. 수동으로 생성하세요: ./setup-velero-secrets.sh"
    fi
else
    log_warning "setup-velero-secrets.sh를 찾을 수 없습니다."
    log_info "수동으로 Secret을 생성하세요:"
    log_info "  kubectl create secret generic cloud-credentials \\"
    log_info "    --namespace $NAMESPACE \\"
    log_info "    --from-file=cloud=~/.aws/credentials"
fi
echo ""

# Step 4: S3 버킷 설정
log_info "Step 4: S3 버킷 설정"
if [ -f "./setup-s3-bucket.sh" ]; then
    chmod +x ./setup-s3-bucket.sh
    read -p "S3 버킷을 생성/설정하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./setup-s3-bucket.sh
        if [ $? -eq 0 ]; then
            log_success "S3 버킷 설정 완료"
        else
            log_warning "S3 버킷 설정 실패"
        fi
    else
        log_info "S3 버킷 설정을 건너뜁니다."
    fi
else
    log_warning "setup-s3-bucket.sh를 찾을 수 없습니다."
fi
echo ""

# Step 5: Velero 설치 확인
log_info "Step 5: Velero 설치 확인"
if kubectl get deployment velero -n "$NAMESPACE" &>/dev/null; then
    log_success "Velero가 이미 설치되어 있습니다."
    
    # BackupStorageLocation 업데이트
    log_info "BackupStorageLocation 업데이트 중..."
    kubectl apply -f velero-install.yaml
    
    # Schedule 업데이트
    log_info "Backup Schedule 업데이트 중..."
    kubectl apply -f velero-install.yaml
else
    log_warning "Velero가 설치되어 있지 않습니다."
    log_info "Velero 설치: kubectl apply -f velero-install.yaml"
fi
echo ""

# Step 6: 설정 검증
log_info "Step 6: 설정 검증"

# ConfigMap 확인
if kubectl get configmap velero-aws-config -n "$NAMESPACE" &>/dev/null; then
    log_success "ConfigMap 확인됨"
else
    log_warning "ConfigMap이 없습니다."
fi

# Secret 확인
if kubectl get secret cloud-credentials -n "$NAMESPACE" &>/dev/null; then
    log_success "Secret 확인됨"
else
    log_warning "Secret이 없습니다. ./setup-velero-secrets.sh를 실행하세요."
fi

# BackupStorageLocation 확인
if kubectl get backupstoragelocation default -n "$NAMESPACE" &>/dev/null; then
    log_success "BackupStorageLocation 확인됨"
    kubectl get backupstoragelocation default -n "$NAMESPACE" -o jsonpath='{.status.phase}' && echo ""
else
    log_warning "BackupStorageLocation이 없습니다."
fi

# Schedule 확인
SCHEDULE_COUNT=$(kubectl get schedule -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l)
if [ "$SCHEDULE_COUNT" -gt 0 ]; then
    log_success "Backup Schedule 확인됨 ($SCHEDULE_COUNT개)"
    kubectl get schedule -n "$NAMESPACE"
else
    log_warning "Backup Schedule이 없습니다."
fi

echo ""
log_info "=========================================="
log_success "설정 완료!"
log_info "=========================================="
echo ""

log_info "다음 단계:"
log_info "  1. 백업 테스트: ./backup-all.sh"
log_info "  2. 백업 상태 확인: kubectl get backups -n $NAMESPACE"
log_info "  3. Schedule 확인: kubectl get schedule -n $NAMESPACE"



