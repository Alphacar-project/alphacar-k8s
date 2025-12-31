#!/bin/bash

# 통합 백업 스크립트
# YAML 파일 백업과 MongoDB 데이터 백업을 모두 실행합니다.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

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
log_info "통합 백업 시작"
log_info "=========================================="
echo ""

# 1. YAML 파일 백업
log_info "Step 1: YAML 파일 백업"
if [ -f "./backup-yaml-files.sh" ]; then
    chmod +x ./backup-yaml-files.sh
    ./backup-yaml-files.sh
    if [ $? -eq 0 ]; then
        log_success "YAML 파일 백업 완료"
    else
        log_error "YAML 파일 백업 실패"
        exit 1
    fi
else
    log_warning "backup-yaml-files.sh를 찾을 수 없습니다."
fi
echo ""

# 2. MongoDB Velero 백업
log_info "Step 2: MongoDB Velero 백업"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="mongodb-manual-backup-${TIMESTAMP}"

# ConfigMap에서 TTL 읽기
NAMESPACE="apc-backup-ns"
CONFIGMAP_NAME="velero-aws-config"
if kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" &>/dev/null; then
    BACKUP_TTL=$(kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" -o jsonpath='{.data.BACKUP_TTL_MONGODB}')
else
    BACKUP_TTL="720h"
fi

log_info "백업 생성: $BACKUP_NAME (TTL: $BACKUP_TTL)"

# Velero CLI 사용 (설치되어 있는 경우)
if command -v velero &> /dev/null; then
    velero backup create "$BACKUP_NAME" \
        --include-namespaces apc-db-ns \
        --selector app=mongodb \
        --storage-location default \
        --ttl "$BACKUP_TTL"
    
    if [ $? -eq 0 ]; then
        log_success "Velero 백업 생성 완료: $BACKUP_NAME"
        log_info "백업 상태 확인: velero backup describe $BACKUP_NAME"
    else
        log_warning "Velero 백업 생성 실패"
    fi
else
    # kubectl 사용 (Velero CRD가 있는 경우)
    log_info "Velero CLI가 없습니다. kubectl을 사용합니다."
    
    # Backup 리소스 직접 생성
    cat <<EOF | kubectl apply -f -
apiVersion: velero.io/v1
kind: Backup
metadata:
  name: ${BACKUP_NAME}
  namespace: apc-backup-ns
spec:
  includedNamespaces:
  - apc-db-ns
  includedResources:
  - "*"
  excludedResources:
  - events
  - events.events.k8s.io
  labelSelector:
    matchLabels:
      app: mongodb
  storageLocation: default
  ttl: ${BACKUP_TTL}0m0s
EOF
    
    if [ $? -eq 0 ]; then
        log_success "Velero 백업 생성 완료: $BACKUP_NAME"
        log_info "백업 상태 확인: kubectl get backup $BACKUP_NAME -n apc-backup-ns"
    else
        log_warning "Velero 백업 생성 실패"
    fi
fi
echo ""

# 3. Longhorn 스냅샷 정보 (참고)
log_info "Step 3: Longhorn 스냅샷 정보"
log_info "Longhorn 스냅샷은 Longhorn UI에서 수동으로 생성하거나 RecurringJob을 설정하세요."
log_info "Longhorn UI: http://192.168.0.170:30080"
echo ""

# 4. 백업 상태 요약
log_info "=========================================="
log_info "백업 완료 요약"
log_info "=========================================="
echo ""

log_info "YAML 파일 백업:"
log_info "  - 로컬: $SCRIPT_DIR/k8s-database-backup-*.tar.gz"
log_info "  - S3: s3://velero-backups/apc-backup/yaml-files/"
echo ""

log_info "MongoDB Velero 백업:"
log_info "  - 백업 이름: $BACKUP_NAME"
log_info "  - 네임스페이스: apc-db-ns"
log_info "  - 저장 위치: S3 (velero-backups/apc-backup)"
log_info "  - TTL: 30일"
echo ""

log_info "백업 확인 명령어:"
log_info "  # Velero 백업 목록"
log_info "  kubectl get backups -n apc-backup-ns"
log_info ""
log_info "  # 백업 상세 정보"
log_info "  kubectl describe backup $BACKUP_NAME -n apc-backup-ns"
log_info ""
log_info "  # S3 백업 확인"
log_info "  aws s3 ls s3://velero-backups/apc-backup/ --recursive"
echo ""

log_success "모든 백업 프로세스 완료!"

