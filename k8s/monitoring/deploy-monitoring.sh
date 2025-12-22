#!/bin/bash

set -e

echo "=========================================="
echo "모니터링 스택 배포 시작"
echo "=========================================="

NAMESPACE="apc-obsv-ns"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 네임스페이스 생성
echo "📦 네임스페이스 생성: $NAMESPACE"
kubectl apply -f $SCRIPT_DIR/namespace.yaml

# 잠시 대기
sleep 2

# 1. Loki 배포
echo ""
echo "1️⃣  Loki 배포 중..."
kubectl apply -f $SCRIPT_DIR/loki-deployment.yaml
echo "✅ Loki 배포 완료"

# 2. Prometheus 배포
echo ""
echo "2️⃣  Prometheus 배포 중..."
kubectl apply -f $SCRIPT_DIR/prometheus-deployment.yaml
echo "✅ Prometheus 배포 완료"

# 3. Tempo 배포
echo ""
echo "3️⃣  Tempo 배포 중..."
kubectl apply -f $SCRIPT_DIR/tempo-deployment.yaml
echo "✅ Tempo 배포 완료"

# 4. Grafana 배포
echo ""
echo "4️⃣  Grafana 배포 중..."
kubectl apply -f $SCRIPT_DIR/grafana-deployment.yaml
echo "✅ Grafana 배포 완료"

# 5. Grafana Alloy 배포
echo ""
echo "5️⃣  Grafana Alloy 배포 중..."
kubectl apply -f $SCRIPT_DIR/grafana-alloy-deployment.yaml
echo "✅ Grafana Alloy 배포 완료"

# 6. Node Exporter 배포
echo ""
echo "6️⃣  Node Exporter 배포 중..."
kubectl apply -f $SCRIPT_DIR/node-exporter-daemonset.yaml
echo "✅ Node Exporter 배포 완료"

# 7. OpenTelemetry Collector 배포
echo ""
echo "7️⃣  OpenTelemetry Collector 배포 중..."
kubectl apply -f $SCRIPT_DIR/opentelemetry-deployment.yaml
echo "✅ OpenTelemetry Collector 배포 완료"

echo ""
echo "=========================================="
echo "모니터링 스택 배포 완료!"
echo "=========================================="
echo ""
echo "배포 상태 확인:"
kubectl get pods -n $NAMESPACE
echo ""
echo "서비스 확인:"
kubectl get svc -n $NAMESPACE

