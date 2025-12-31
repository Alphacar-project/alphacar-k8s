#!/bin/bash

# MongoDB 백업 파일로부터 복원 스크립트
# 주의: 이 스크립트는 MongoDB 데이터를 덮어씁니다

set -e

BACKUP_FILE="/home/alphacar/dbbackup/a/mongodb-20251215-141711.tar.gz"
NAMESPACE="apc-db-ns"
MONGODB_SERVICE="mongodb.apc-db-ns.svc.cluster.local"
MONGODB_PORT="27017"
MONGODB_USER="triple_user"
MONGODB_PASSWORD="triple_password"
MONGODB_DB="triple_db"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
log_info "MongoDB 백업 복원"
log_info "=========================================="
echo ""

# 1. 백업 파일 확인
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "백업 파일을 찾을 수 없습니다: $BACKUP_FILE"
    exit 1
fi

log_success "백업 파일 확인: $BACKUP_FILE"
log_info "파일 크기: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""

# 2. 현재 실행 중인 Job 확인
log_warning "⚠️  현재 실행 중인 작업 확인:"
RUNNING_JOBS=$(kubectl get pods -n apc-backup-ns -l app=car-image-migration --field-selector=status.phase=Running -o name 2>/dev/null || echo "")
if [ -n "$RUNNING_JOBS" ]; then
    log_warning "  - S3 이미지 업로드 Job이 실행 중입니다!"
    log_warning "  - 복원 중에는 Job이 MongoDB에 접근하지 못할 수 있습니다."
    log_warning "  - 복원 후 Job이 이미 처리한 문서를 다시 처리할 수 있지만,"
    log_warning "    중복 업로드는 발생하지 않습니다 (S3 URL 확인 로직)."
    echo ""
    read -p "계속하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "복원 작업 취소됨"
        exit 0
    fi
else
    log_success "  - 실행 중인 Job 없음"
fi
echo ""

# 3. MongoDB 연결 확인
log_info "MongoDB 연결 확인 중..."
if ! kubectl exec -n $NAMESPACE mongodb-0 -- mongosh --quiet \
    --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    log_error "MongoDB에 연결할 수 없습니다"
    exit 1
fi
log_success "MongoDB 연결 확인 완료"
echo ""

# 4. Primary 노드 찾기
log_info "Primary 노드 확인 중..."
PRIMARY_NODE=$(kubectl exec -n $NAMESPACE mongodb-0 -- mongosh --quiet \
    --eval "try { rs.status().members.find(m => m.stateStr === 'PRIMARY').name } catch(e) { 'mongodb-0' }" 2>/dev/null | tr -d '\r\n' || echo "mongodb-0")

# Primary 노드 이름에서 FQDN 제거 (pod 이름만 사용)
PRIMARY_POD=$(echo "$PRIMARY_NODE" | cut -d'.' -f1)
log_info "Primary Pod: $PRIMARY_POD"
echo ""

# 5. MongoDB 복원
log_warning "⚠️  MongoDB 데이터 복원을 시작합니다."
log_warning "   이 작업은 기존 데이터를 덮어씁니다!"
echo ""

# 백업 파일을 Pod로 복사
log_info "백업 파일을 Pod로 복사 중..."
kubectl cp "$BACKUP_FILE" "$NAMESPACE/$PRIMARY_POD:/tmp/mongodb-backup.tar.gz" || {
    log_error "백업 파일을 Pod로 복사하는데 실패했습니다"
    exit 1
}
log_success "백업 파일 복사 완료"

# Pod 내부에서 압축 해제 및 복원
log_info "Pod 내부에서 압축 해제 및 복원 중..."
kubectl exec -n $NAMESPACE "$PRIMARY_POD" -- bash -c "
    cd /tmp && \
    tar -xzf mongodb-backup.tar.gz && \
    mongorestore \
        --host localhost:27017 \
        --username '$MONGODB_USER' \
        --password '$MONGODB_PASSWORD' \
        --authenticationDatabase admin \
        --db '$MONGODB_DB' \
        --drop \
        mongodb-20251215-141711/triple_db && \
    rm -rf mongodb-backup.tar.gz mongodb-20251215-141711
" 2>&1 | while IFS= read -r line; do
    echo "  $line"
done

RESTORE_EXIT_CODE=${PIPESTATUS[0]}

if [ $RESTORE_EXIT_CODE -eq 0 ]; then
    log_success "MongoDB 복원 완료!"
    echo ""
    log_info "복원된 데이터베이스: $MONGODB_DB"
    log_info "복원 시간: $(date)"
    echo ""
    log_warning "참고:"
    log_warning "  - S3 이미지 업로드 Job은 계속 실행됩니다"
    log_warning "  - 이미 처리된 문서는 S3 URL 확인으로 인해 중복 업로드되지 않습니다"
    log_warning "  - 새로 복원된 문서는 원본 URL을 가지고 있으므로 정상적으로 처리됩니다"
else
    log_error "MongoDB 복원 실패 (종료 코드: $RESTORE_EXIT_CODE)"
    exit 1
fi

