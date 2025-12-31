#!/bin/bash

# Kafka Connect 및 S3 Sink Connector 설정 스크립트

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NAMESPACE="apc-striming-ns"
BACKUP_NAMESPACE="apc-backup-ns"
SECRET_NAME="cloud-credentials"
KAFKA_CONNECT_SECRET="kafka-connect-aws-credentials"

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
log_info "Kafka Connect S3 Sink Connector 설정"
log_info "=========================================="
echo ""

# Step 1: AWS 자격증명 Secret 생성
log_info "Step 1: AWS 자격증명 Secret 생성 중..."

if ! kubectl get secret "$SECRET_NAME" -n "$BACKUP_NAMESPACE" &>/dev/null; then
    log_error "기존 AWS Secret을 찾을 수 없습니다: $SECRET_NAME in $BACKUP_NAMESPACE"
    exit 1
fi

# 기존 Secret에서 자격증명 추출
CREDENTIALS=$(kubectl get secret "$SECRET_NAME" -n "$BACKUP_NAMESPACE" -o jsonpath='{.data.cloud}' | base64 -d)
AWS_ACCESS_KEY_ID=$(echo "$CREDENTIALS" | grep -E "^aws_access_key_id" | sed 's/.*= *//' | tr -d ' ' | tr -d '\r')
AWS_SECRET_ACCESS_KEY=$(echo "$CREDENTIALS" | grep -E "^aws_secret_access_key" | sed 's/.*= *//' | tr -d ' ' | tr -d '\r')

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    log_error "AWS 자격증명을 추출할 수 없습니다."
    exit 1
fi

# Kafka Connect용 Secret 생성
if kubectl get secret "$KAFKA_CONNECT_SECRET" -n "$NAMESPACE" &>/dev/null; then
    log_warning "Secret이 이미 존재합니다. 업데이트합니다..."
    kubectl delete secret "$KAFKA_CONNECT_SECRET" -n "$NAMESPACE"
fi

kubectl create secret generic "$KAFKA_CONNECT_SECRET" \
    --namespace "$NAMESPACE" \
    --from-literal=aws-access-key-id="$AWS_ACCESS_KEY_ID" \
    --from-literal=aws-secret-access-key="$AWS_SECRET_ACCESS_KEY"

log_success "AWS 자격증명 Secret 생성 완료"
echo ""

# Step 2: S3 버킷 확인
log_info "Step 2: S3 버킷 확인 중..."

# Account ID 추출 (기존 버킷 이름에서)
ACCOUNT_ID="${ACCOUNT_ID:-382045063773}"
S3_BUCKET="yaml-${ACCOUNT_ID}"

log_info "사용할 S3 버킷: $S3_BUCKET"
log_warning "버킷이 존재하는지 확인하세요. 없으면 ./setup-s3-buckets.sh를 실행하세요."
echo ""

# Step 3: Kafka Connect 배포
log_info "Step 3: Kafka Connect 배포 중..."

# Docker 이미지 빌드 설정 확인
log_warning "주의: Kafka Connect는 커스텀 플러그인을 포함한 Docker 이미지를 빌드해야 합니다."
log_warning "현재 설정은 Docker 레지스트리 Secret이 필요합니다."
log_warning "Docker 레지스트리 Secret이 없으면 build 섹션을 제거하고 수동으로 이미지를 빌드해야 합니다."
echo ""

read -p "Kafka Connect를 배포하시겠습니까? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "배포를 취소했습니다."
    exit 0
fi

kubectl apply -f kafka-connect.yaml

log_info "Kafka Connect 배포 완료. 상태 확인 중..."
sleep 5

# Step 4: Kafka Connect 상태 확인
log_info "Step 4: Kafka Connect 상태 확인 중..."
kubectl wait --for=condition=Ready kafkaconnect/kafka-connect-cluster -n "$NAMESPACE" --timeout=300s || {
    log_warning "Kafka Connect가 준비되지 않았습니다. 수동으로 확인하세요:"
    log_info "  kubectl get kafkaconnect -n $NAMESPACE"
    log_info "  kubectl logs -n $NAMESPACE -l strimzi.io/kind=KafkaConnect"
}

echo ""

# Step 5: Kafka Connector 배포
log_info "Step 5: Kafka Connector 배포 중..."

# Account ID를 실제 값으로 업데이트
if [ -n "$ACCOUNT_ID" ]; then
    log_info "S3 버킷 이름에 Account ID 적용 중..."
    sed -i "s/yaml-382045063773/yaml-${ACCOUNT_ID}/g" kafka-connector-s3-*.yaml
fi

kubectl apply -f kafka-connector-s3-specifications.yaml
kubectl apply -f kafka-connector-s3-options.yaml
kubectl apply -f kafka-connector-s3-images.yaml
kubectl apply -f kafka-connector-s3-reviews.yaml

log_success "모든 Kafka Connector 배포 완료"
echo ""

# Step 6: 상태 확인
log_info "Step 6: Connector 상태 확인 중..."
sleep 10

kubectl get kafkaconnector -n "$NAMESPACE"

echo ""
log_info "=========================================="
log_success "설정 완료!"
log_info "=========================================="
echo ""
log_info "다음 명령어로 상태를 확인할 수 있습니다:"
log_info "  kubectl get kafkaconnect -n $NAMESPACE"
log_info "  kubectl get kafkaconnector -n $NAMESPACE"
log_info "  kubectl describe kafkaconnector <connector-name> -n $NAMESPACE"
log_info "  kubectl logs -n $NAMESPACE -l strimzi.io/kind=KafkaConnect"
echo ""
log_info "S3 버킷에서 데이터 확인:"
log_info "  aws s3 ls s3://${S3_BUCKET}/crawler-data/ --recursive"

