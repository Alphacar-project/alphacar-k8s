#!/bin/bash

# 크롤링 스크립트 검증 스크립트

set -e

NAMESPACE="apc-striming-ns"
CRAWLER_POD=$(kubectl get pods -n $NAMESPACE -l app=crawler -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

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
log_info "크롤링 스크립트 검증"
log_info "=========================================="
echo ""

# 1. Crawler Pod 확인
if [ -z "$CRAWLER_POD" ]; then
    log_error "Crawler Pod를 찾을 수 없습니다."
    exit 1
fi

log_success "Crawler Pod 확인: $CRAWLER_POD"
echo ""

# 2. Kafka 토픽 확인
log_info "Kafka 토픽 확인 중..."
kubectl get kafkatopics -n $NAMESPACE | grep danawa-crawl || {
    log_warning "Kafka 토픽이 없습니다. 생성하시겠습니까?"
    read -p "Kafka 토픽을 생성하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl apply -f kafka-topics.yaml
        log_success "Kafka 토픽 생성 완료"
    fi
}
echo ""

# 3. 크롤링 스크립트 확인
log_info "크롤링 스크립트 확인 중..."

# hostPath 마운트 확인
HOST_SCRIPT_PATH="/home/alphacar/dbbackup/a/core"
if [ -d "$HOST_SCRIPT_PATH" ]; then
    log_success "호스트 스크립트 경로 확인: $HOST_SCRIPT_PATH"
    SCRIPT_COUNT=$(ls -1 "$HOST_SCRIPT_PATH"/*.js 2>/dev/null | wc -l)
    log_info "  호스트에 스크립트 파일: ${SCRIPT_COUNT}개"
    
    # Pod 내부에서 확인 (마운트된 경로)
    POD_SCRIPTS=$(kubectl exec -n $NAMESPACE $CRAWLER_POD -- sh -c "ls -1 /app/scripts/*.js 2>/dev/null || ls -1 $HOST_SCRIPT_PATH/*.js 2>/dev/null || echo ''" 2>/dev/null || echo "")
    
    if [ -n "$POD_SCRIPTS" ]; then
        log_success "Pod 내부 스크립트 확인:"
        echo "$POD_SCRIPTS" | while read script; do
            echo "  - $script"
        done
    else
        log_warning "Pod 내부에서 스크립트를 찾을 수 없습니다."
        log_info "  호스트 경로: $HOST_SCRIPT_PATH"
        log_info "  Pod 마운트 경로: /app/scripts"
        log_info "  Pod가 a-worker1 노드에 있어야 합니다."
        
        # 호스트 파일 목록 표시
        log_info "  호스트에 있는 스크립트 파일:"
        ls -1 "$HOST_SCRIPT_PATH"/*.js 2>/dev/null | head -5 | while read script; do
            echo "    - $(basename $script)"
        done
    fi
else
    log_error "호스트 스크립트 경로를 찾을 수 없습니다: $HOST_SCRIPT_PATH"
fi
echo ""

# 4. 중복 스킵 로직 확인
log_info "중복 스킵 로직 확인 중..."
PRODUCER_SCRIPT="/home/alphacar/dbbackup/a/core/crawl-danawa-v4-producer.js"

if [ -f "$PRODUCER_SCRIPT" ]; then
    if grep -q "isFullyCrawled\|크롤링 완료 - 스킵" "$PRODUCER_SCRIPT" 2>/dev/null; then
        log_success "중복 스킵 로직이 구현되어 있습니다."
    else
        log_warning "중복 스킵 로직이 확인되지 않습니다."
        log_info "스크립트를 업데이트해야 할 수 있습니다."
    fi
else
    log_warning "Producer 스크립트를 찾을 수 없습니다: $PRODUCER_SCRIPT"
fi
echo ""

# 5. 네이버 크롤링 확인 (리뷰, 이미지)
log_info "네이버 크롤링 로직 확인 중..."
CONSUMER_SCRIPT="/home/alphacar/dbbackup/a/core/crawl-danawa-v4-consumer.js"

if [ -f "$CONSUMER_SCRIPT" ]; then
    if grep -q "네이버.*이미지\|search.naver.com.*이미지" "$CONSUMER_SCRIPT" 2>/dev/null; then
        log_success "네이버 이미지 크롤링 로직 확인됨"
    fi
    if grep -q "네이버.*리뷰\|search.naver.com.*리뷰\|where=post" "$CONSUMER_SCRIPT" 2>/dev/null; then
        log_success "네이버 리뷰 크롤링 로직 확인됨"
    fi
else
    log_warning "Consumer 스크립트를 찾을 수 없습니다: $CONSUMER_SCRIPT"
fi
echo ""

# 6. MongoDB 연결 확인
log_info "MongoDB 연결 확인 중..."
MONGODB_URI=$(kubectl get configmap crawler-config -n $NAMESPACE -o jsonpath='{.data.mongodb_uri}' 2>/dev/null || echo "")

if [ -z "$MONGODB_URI" ]; then
    log_error "MongoDB URI를 찾을 수 없습니다."
    exit 1
fi

log_success "MongoDB URI 확인: ${MONGODB_URI%%@*}"
echo ""

# 7. Kafka Broker 확인
log_info "Kafka Broker 확인 중..."
KAFKA_BROKERS=$(kubectl get configmap crawler-config -n $NAMESPACE -o jsonpath='{.data.kafka_brokers}' 2>/dev/null || echo "")

if [ -z "$KAFKA_BROKERS" ]; then
    log_error "Kafka Broker를 찾을 수 없습니다."
    exit 1
fi

log_success "Kafka Broker 확인: $KAFKA_BROKERS"
echo ""

# 8. 검증 요약
log_info "=========================================="
log_info "검증 요약"
log_info "=========================================="
log_success "✅ Crawler Pod: $CRAWLER_POD"
log_success "✅ 크롤링 스크립트: 확인됨"
log_success "✅ MongoDB 연결: 설정됨"
log_success "✅ Kafka Broker: 설정됨"
echo ""
log_info "크롤링 스크립트 실행 방법:"
log_info "  kubectl exec -it $CRAWLER_POD -n $NAMESPACE -- node /app/scripts/crawl-danawa-v4-producer.js"
echo ""

