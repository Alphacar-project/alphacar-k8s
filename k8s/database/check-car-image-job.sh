#!/bin/bash

# 차량 이미지 업로드 Job 점검 스크립트

set -e

NAMESPACE="apc-backup-ns"
JOB_NAME="car-image-migration"
CONFIGMAP_NAME="car-image-migration-script"
MONGODB_NS="apc-db-ns"
MONGODB_SERVICE="mongodb.apc-db-ns.svc.cluster.local"
S3_BUCKET="carimage-382045063773"

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
log_info "차량 이미지 업로드 Job 점검"
log_info "=========================================="
echo ""

# 1. Job 상태 확인
log_info "1. Job 상태 확인 중..."
JOB_STATUS=$(kubectl get job $JOB_NAME -n $NAMESPACE -o jsonpath='{.status.conditions[0].type}' 2>/dev/null || echo "NotFound")
JOB_AGE=$(kubectl get job $JOB_NAME -n $NAMESPACE -o jsonpath='{.metadata.creationTimestamp}' 2>/dev/null || echo "")

if [ "$JOB_STATUS" = "Complete" ]; then
    log_success "Job 상태: 완료"
elif [ "$JOB_STATUS" = "Failed" ]; then
    log_error "Job 상태: 실패"
    log_info "  생성 시간: $JOB_AGE"
else
    log_warning "Job 상태: $JOB_STATUS"
fi
echo ""

# 2. Pod 상태 확인
log_info "2. Pod 상태 확인 중..."
PODS=$(kubectl get pods -n $NAMESPACE -l app=car-image-migration --sort-by=.metadata.creationTimestamp -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")

if [ -z "$PODS" ]; then
    log_warning "실행 중인 Pod가 없습니다."
    log_info "  (Job이 완료되었거나 실패한 Pod가 삭제되었을 수 있습니다)"
else
    log_success "Pod 확인:"
    for pod in $PODS; do
        POD_STATUS=$(kubectl get pod $pod -n $NAMESPACE -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
        echo "  - $pod: $POD_STATUS"
    done
fi
echo ""

# 3. 최근 Pod 로그 확인
log_info "3. 최근 Pod 로그 확인 중..."
RECENT_POD=$(kubectl get pods -n $NAMESPACE -l app=car-image-migration --sort-by=.metadata.creationTimestamp -o jsonpath='{.items[-1].metadata.name}' 2>/dev/null || echo "")

if [ -n "$RECENT_POD" ]; then
    log_info "Pod: $RECENT_POD"
    echo "--- 로그 (마지막 30줄) ---"
    kubectl logs -n $NAMESPACE $RECENT_POD --tail=30 2>&1 | head -30 || log_warning "로그를 가져올 수 없습니다."
    echo "---"
else
    log_warning "로그를 확인할 Pod가 없습니다."
fi
echo ""

# 4. ConfigMap 확인
log_info "4. ConfigMap 확인 중..."
if kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE &>/dev/null; then
    log_success "ConfigMap 존재: $CONFIGMAP_NAME"
    SCRIPT_SIZE=$(kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.migrate\.py}' | wc -l 2>/dev/null || echo "0")
    log_info "  스크립트 라인 수: $SCRIPT_SIZE"
    
    # 중복 스킵 로직 확인
    if kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.migrate\.py}' | grep -q "s3_exterior\|s3_interior\|s3_colors"; then
        log_success "  원본 보존 로직 확인됨 (s3_ 필드 사용)"
    else
        log_warning "  원본 보존 로직 확인 필요"
    fi
else
    log_error "ConfigMap을 찾을 수 없습니다: $CONFIGMAP_NAME"
fi
echo ""

# 5. MongoDB 데이터 상태 확인
log_info "5. MongoDB 데이터 상태 확인 중..."
MONGODB_POD=$(kubectl get pods -n $MONGODB_NS -l app=mongodb -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -n "$MONGODB_POD" ]; then
    log_success "MongoDB Pod: $MONGODB_POD"
    
    # danawa_vehicle_data 컬렉션 통계
    TOTAL_DOCS=$(kubectl exec -n $MONGODB_NS $MONGODB_POD -- mongosh --quiet --eval "db.getSiblingDB('triple_db').danawa_vehicle_data.countDocuments({})" 2>/dev/null | tr -d '\r\n' || echo "0")
    log_info "  총 문서 수: $TOTAL_DOCS"
    
    # S3 URL이 있는 문서 수
    S3_DOCS=$(kubectl exec -n $MONGODB_NS $MONGODB_POD -- mongosh --quiet --eval "db.getSiblingDB('triple_db').danawa_vehicle_data.countDocuments({ \$or: [{ s3_image_url: { \$exists: true } }, { s3_exterior_images: { \$exists: true } }, { s3_interior_images: { \$exists: true } }, { s3_color_images: { \$exists: true } }] })" 2>/dev/null | tr -d '\r\n' || echo "0")
    log_info "  S3 URL이 있는 문서: $S3_DOCS"
    
    # 원본 URL이 있는 문서 수
    ORIGINAL_DOCS=$(kubectl exec -n $MONGODB_NS $MONGODB_POD -- mongosh --quiet --eval "db.getSiblingDB('triple_db').danawa_vehicle_data.countDocuments({ \$or: [{ image_url: { \$regex: /^https?:\/\// } }, { exterior_images: { \$exists: true } }, { interior_images: { \$exists: true } }, { color_images: { \$exists: true } }] })" 2>/dev/null | tr -d '\r\n' || echo "0")
    log_info "  원본 URL이 있는 문서: $ORIGINAL_DOCS"
    
    # 샘플 문서 확인
    log_info "  샘플 문서 필드:"
    SAMPLE=$(kubectl exec -n $MONGODB_NS $MONGODB_POD -- mongosh --quiet --eval "db.getSiblingDB('triple_db').danawa_vehicle_data.findOne({}, { image_url: 1, s3_image_url: 1, exterior_images: 1, s3_exterior_images: 1, _id: 0 })" 2>/dev/null | head -10)
    echo "$SAMPLE" | sed 's/^/    /'
else
    log_error "MongoDB Pod를 찾을 수 없습니다."
fi
echo ""

# 6. AWS/S3 설정 확인
log_info "6. AWS/S3 설정 확인 중..."
if kubectl get secret cloud-credentials -n $NAMESPACE &>/dev/null; then
    log_success "AWS Secret 존재: cloud-credentials"
else
    log_error "AWS Secret을 찾을 수 없습니다: cloud-credentials"
fi

if kubectl get configmap velero-aws-config -n $NAMESPACE &>/dev/null; then
    S3_REGION=$(kubectl get configmap velero-aws-config -n $NAMESPACE -o jsonpath='{.data.S3_REGION}' 2>/dev/null || echo "")
    log_success "AWS ConfigMap 존재: velero-aws-config"
    log_info "  S3 리전: $S3_REGION"
    log_info "  S3 버킷: $S3_BUCKET"
else
    log_error "AWS ConfigMap을 찾을 수 없습니다: velero-aws-config"
fi
echo ""

# 7. 요약 및 권장사항
log_info "=========================================="
log_info "점검 요약"
log_info "=========================================="

if [ "$JOB_STATUS" = "Failed" ]; then
    log_error "⚠️  Job이 실패했습니다."
    log_info "권장사항:"
    log_info "  1. Job 삭제 후 재실행: kubectl delete job $JOB_NAME -n $NAMESPACE && kubectl apply -f migrate-car-images-job.yaml"
    log_info "  2. Pod 로그 확인: kubectl logs -n $NAMESPACE <pod-name>"
elif [ "$JOB_STATUS" = "Complete" ]; then
    log_success "✅ Job이 완료되었습니다."
    log_info "  - 처리된 문서: $S3_DOCS / $TOTAL_DOCS"
else
    log_warning "⚠️  Job 상태를 확인할 수 없습니다."
fi
echo ""


