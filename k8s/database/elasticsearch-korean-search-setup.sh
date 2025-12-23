#!/bin/bash

# Elasticsearch 한글 유사어 검색 설정 스크립트
# 한글 자모 분리 및 오타 허용 검색을 위한 인덱스 템플릿 적용

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
log_info "Elasticsearch 한글 유사어 검색 설정"
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

# 2. 기존 인덱스 템플릿 삭제 (선택사항)
log_info "2. 기존 인덱스 템플릿 확인 중..."
EXISTING_TEMPLATE=$(kubectl exec -n $NAMESPACE $ES_POD -- curl -s "http://localhost:9200/_index_template/vehicles_template" 2>/dev/null | grep -o '"found":true' || echo "")

if [ -n "$EXISTING_TEMPLATE" ]; then
    log_warning "기존 템플릿이 존재합니다. 업데이트합니다."
    kubectl exec -n $NAMESPACE $ES_POD -- curl -s -X PUT \
      "http://localhost:9200/_index_template/vehicles_template" \
      -H 'Content-Type: application/json' \
      -d @- < elasticsearch-index-template.json > /dev/null 2>&1
    log_success "인덱스 템플릿 업데이트 완료"
else
    # 3. 인덱스 템플릿 생성
    log_info "3. 인덱스 템플릿 생성 중..."
    kubectl exec -n $NAMESPACE $ES_POD -- curl -s -X PUT \
      "http://localhost:9200/_index_template/vehicles_template" \
      -H 'Content-Type: application/json' \
      -d @- < elasticsearch-index-template.json > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "인덱스 템플릿 생성 완료"
    else
        log_error "인덱스 템플릿 생성 실패"
        exit 1
    fi
fi
echo ""

# 4. 기존 vehicles 인덱스가 있으면 재인덱싱 안내
log_info "4. 기존 인덱스 확인 중..."
EXISTING_INDEX=$(kubectl exec -n $NAMESPACE $ES_POD -- curl -s "http://localhost:9200/_cat/indices/vehicles" 2>/dev/null | grep vehicles || echo "")

if [ -n "$EXISTING_INDEX" ]; then
    log_warning "기존 vehicles 인덱스가 존재합니다."
    log_warning "새 템플릿을 적용하려면 인덱스를 재생성해야 합니다."
    echo ""
    read -p "기존 인덱스를 삭제하고 재생성하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "기존 인덱스 삭제 중..."
        kubectl exec -n $NAMESPACE $ES_POD -- curl -s -X DELETE "http://localhost:9200/vehicles" > /dev/null 2>&1
        log_success "인덱스 삭제 완료"
        log_info "Monstache가 데이터를 다시 동기화하면 새 템플릿이 적용됩니다."
    else
        log_info "인덱스 유지. 새 템플릿은 새로 생성되는 인덱스에만 적용됩니다."
    fi
else
    log_success "인덱스가 없습니다. Monstache가 데이터를 동기화하면 새 템플릿이 적용됩니다."
fi
echo ""

# 5. 템플릿 확인
log_info "5. 템플릿 설정 확인 중..."
TEMPLATE_INFO=$(kubectl exec -n $NAMESPACE $ES_POD -- curl -s "http://localhost:9200/_index_template/vehicles_template" 2>/dev/null)
if echo "$TEMPLATE_INFO" | grep -q "korean_fuzzy_analyzer"; then
    log_success "한글 유사어 검색 분석기가 설정되었습니다."
else
    log_warning "템플릿 확인 중 오류가 발생했습니다."
fi
echo ""

log_success "Elasticsearch 한글 유사어 검색 설정 완료!"
echo ""
log_info "설정된 기능:"
log_info "  - 한글 ngram 분석기: 부분 일치 검색"
log_info "  - 한글 자모 필터: 오타 허용 검색"
log_info "  - Fuzzy matching: 유사어 검색"
echo ""
log_info "검색 예시:"
log_info "  - '아반떼' 검색 시 'dkqksEp', '어반떼', '아반띄', '아반ㄸ' 등도 검색됨"
log_info "  - 모든 차량명에 동일하게 적용됨"
echo ""
log_info "다음 단계:"
log_info "  1. Monstache가 MongoDB 데이터를 동기화할 때까지 대기"
log_info "  2. 검색 백엔드에서 Elasticsearch 클라이언트 설정"
log_info "  3. 유사어 검색 쿼리 구현 (fuzzy, ngram 필드 활용)"
log_info ""
log_info "Elasticsearch URL: http://$ES_SERVICE"
log_info "Kibana URL: http://kibana.apc-ek-ns.svc.cluster.local:5601"

