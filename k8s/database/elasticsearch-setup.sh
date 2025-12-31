#!/bin/bash

# Elasticsearch 인덱스 템플릿 및 설정 스크립트

set -e

NAMESPACE="apc-ek-ns"
ES_SERVICE="elasticsearch.apc-ek-ns.svc.cluster.local:9200"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
log_info "Elasticsearch 설정"
log_info "=========================================="
echo ""

# 1. Elasticsearch 연결 확인
log_info "1. Elasticsearch 연결 확인 중..."
ES_POD=$(kubectl get pods -n $NAMESPACE -l app=elasticsearch -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -z "$ES_POD" ]; then
    log_error "Elasticsearch Pod를 찾을 수 없습니다."
    exit 1
fi

log_success "Elasticsearch Pod: $ES_POD"

# Elasticsearch 준비 대기
log_info "Elasticsearch 준비 대기 중..."
for i in {1..30}; do
    if kubectl exec -n $NAMESPACE $ES_POD -- curl -s http://localhost:9200 > /dev/null 2>&1; then
        log_success "Elasticsearch 연결 성공"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Elasticsearch 연결 실패"
        exit 1
    fi
    sleep 2
done
echo ""

# 2. 인덱스 템플릿 생성
log_info "2. 인덱스 템플릿 생성 중..."
TEMPLATE_FILE="elasticsearch-index-template.json"

if [ ! -f "$TEMPLATE_FILE" ]; then
    log_error "템플릿 파일을 찾을 수 없습니다: $TEMPLATE_FILE"
    exit 1
fi

kubectl exec -n $NAMESPACE $ES_POD -- curl -s -X PUT \
  "http://localhost:9200/_index_template/vehicles_template" \
  -H 'Content-Type: application/json' \
  -d @- < "$TEMPLATE_FILE" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    log_success "인덱스 템플릿 생성 완료"
else
    log_warning "인덱스 템플릿 생성 실패 (이미 존재할 수 있음)"
fi
echo ""

# 3. Elasticsearch 상태 확인
log_info "3. Elasticsearch 상태 확인 중..."
kubectl exec -n $NAMESPACE $ES_POD -- curl -s http://localhost:9200/_cluster/health | jq '.' 2>/dev/null || {
    log_info "클러스터 상태:"
    kubectl exec -n $NAMESPACE $ES_POD -- curl -s http://localhost:9200/_cluster/health
}
echo ""

# 4. 인덱스 확인
log_info "4. 인덱스 확인 중..."
INDICES=$(kubectl exec -n $NAMESPACE $ES_POD -- curl -s http://localhost:9200/_cat/indices 2>/dev/null || echo "")
if [ -n "$INDICES" ]; then
    log_info "현재 인덱스:"
    echo "$INDICES" | sed 's/^/  /'
else
    log_warning "인덱스가 아직 생성되지 않았습니다. Monstache가 데이터를 동기화하면 자동으로 생성됩니다."
fi
echo ""

log_success "Elasticsearch 설정 완료!"
log_info ""
log_info "다음 단계:"
log_info "  1. Monstache가 MongoDB 데이터를 동기화할 때까지 대기"
log_info "  2. 백엔드에서 Elasticsearch 클라이언트 설정"
log_info "  3. 유사어 검색 API 구현"
log_info ""
log_info "Elasticsearch URL: http://$ES_SERVICE"
log_info "Kibana URL: http://kibana.apc-ek-ns.svc.cluster.local:5601"


