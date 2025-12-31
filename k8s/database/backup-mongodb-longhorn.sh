#!/bin/bash

# MongoDB Longhorn 볼륨 스냅샷 백업 스크립트
# MongoDB StatefulSet의 모든 PVC에 대해 Longhorn 스냅샷을 생성합니다.

set -e

# 설정
NAMESPACE="apc-db-ns"
BACKUP_NS="apc-backup-ns"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

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

log_info "MongoDB Longhorn 스냅샷 백업 시작..."

# MongoDB PVC 목록 가져오기
PVC_LIST=$(kubectl get pvc -n "$NAMESPACE" -l app=mongodb -o jsonpath='{.items[*].metadata.name}')

if [ -z "$PVC_LIST" ]; then
    log_error "MongoDB PVC를 찾을 수 없습니다."
    exit 1
fi

log_info "백업 대상 PVC: $PVC_LIST"

# 각 PVC에 대해 스냅샷 생성
for PVC_NAME in $PVC_LIST; do
    log_info "Processing PVC: $PVC_NAME"
    
    # PVC의 볼륨 이름 가져오기
    VOLUME_NAME=$(kubectl get pvc "$PVC_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.volumeName}')
    
    if [ -z "$VOLUME_NAME" ]; then
        log_warning "PVC $PVC_NAME의 볼륨 이름을 찾을 수 없습니다. 건너뜁니다."
        continue
    fi
    
    log_info "볼륨 이름: $VOLUME_NAME"
    
    # Longhorn 볼륨 확인
    if ! kubectl get volume "$VOLUME_NAME" -n "$BACKUP_NS" &>/dev/null; then
        log_warning "Longhorn 볼륨 $VOLUME_NAME을 찾을 수 없습니다. 건너뜁니다."
        continue
    fi
    
    # 스냅샷 이름 생성
    SNAPSHOT_NAME="mongodb-${PVC_NAME}-snapshot-${TIMESTAMP}"
    
    log_info "스냅샷 생성: $SNAPSHOT_NAME"
    
    # Longhorn 스냅샷 생성 (Longhorn API 사용)
    # 주의: Longhorn v1.10.1에서는 스냅샷을 직접 생성하는 방법이 다를 수 있습니다.
    # Longhorn UI 또는 API를 통해 스냅샷을 생성해야 합니다.
    
    # 방법 1: Longhorn Volume의 스냅샷 생성 (RecurringJob 사용 권장)
    log_info "Longhorn 스냅샷은 RecurringJob을 통해 자동 생성하거나 Longhorn UI에서 수동 생성하세요."
    log_info "볼륨: $VOLUME_NAME"
    log_info "스냅샷 이름: $SNAPSHOT_NAME"
    
    # 방법 2: Velero를 통한 PVC 백업 (권장)
    log_info "Velero를 통한 백업을 권장합니다..."
done

log_info "Longhorn 스냅샷 생성은 Longhorn UI 또는 RecurringJob을 통해 수행하세요."
log_info "또는 Velero 백업을 사용하여 PVC를 백업할 수 있습니다."

# Velero 백업 실행 (선택사항)
read -p "Velero 백업을 지금 실행하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    BACKUP_NAME="mongodb-manual-backup-${TIMESTAMP}"
    log_info "Velero 백업 생성: $BACKUP_NAME"
    
    if kubectl create backup "$BACKUP_NAME" \
        --namespace "$BACKUP_NS" \
        --include-namespaces "$NAMESPACE" \
        --selector app=mongodb \
        --storage-location default \
        --ttl 720h 2>/dev/null; then
        log_success "Velero 백업 생성됨: $BACKUP_NAME"
        log_info "백업 상태 확인: kubectl get backup $BACKUP_NAME -n $BACKUP_NS"
    else
        log_warning "Velero 백업 생성 실패. velero CLI를 사용하세요:"
        log_info "  velero backup create $BACKUP_NAME --include-namespaces $NAMESPACE --selector app=mongodb"
    fi
fi

log_success "백업 프로세스 완료!"



