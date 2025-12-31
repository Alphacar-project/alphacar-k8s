#!/bin/bash

set -e

echo "=========================================="
echo "모니터링 분석 시스템 배포 시작"
echo "=========================================="

NAMESPACE="apc-obsv-ns"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 네임스페이스 확인
echo "📦 네임스페이스 확인: $NAMESPACE"
kubectl get namespace $NAMESPACE || {
  echo "❌ 네임스페이스가 없습니다. 먼저 네임스페이스를 생성하세요."
  exit 1
}

# 1. 시크릿 및 ConfigMap 생성
echo ""
echo "1️⃣  시크릿 및 ConfigMap 생성 중..."
kubectl apply -f $SCRIPT_DIR/monitoring-analysis/secret.yaml
kubectl apply -f $SCRIPT_DIR/monitoring-analysis/configmap.yaml
kubectl apply -f $SCRIPT_DIR/monitoring-analysis/frontend/config.yaml
echo "✅ 시크릿 및 ConfigMap 생성 완료"

# 2. RBAC 설정
echo ""
echo "2️⃣  RBAC 설정 중..."
kubectl apply -f $SCRIPT_DIR/monitoring-analysis/rbac.yaml
echo "✅ RBAC 설정 완료"

# 3. Backend 배포
echo ""
echo "3️⃣  Backend 배포 중..."
kubectl apply -f $SCRIPT_DIR/monitoring-analysis/backend/service.yaml
kubectl apply -f $SCRIPT_DIR/monitoring-analysis/backend/deployment.yaml
echo "✅ Backend 배포 완료"

# 4. Frontend 배포
echo ""
echo "4️⃣  Frontend 배포 중..."
kubectl apply -f $SCRIPT_DIR/monitoring-analysis/frontend/service.yaml
kubectl apply -f $SCRIPT_DIR/monitoring-analysis/frontend/deployment.yaml
echo "✅ Frontend 배포 완료"

# 5. Ingress 설정
echo ""
echo "5️⃣  Ingress 설정 중..."
kubectl apply -f $SCRIPT_DIR/monitoring-analysis/ingress.yaml
echo "✅ Ingress 설정 완료"

# 6. CronJob 설정 (선택)
echo ""
read -p "일일 리포트 CronJob을 생성하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  kubectl apply -f $SCRIPT_DIR/monitoring-analysis/cronjob.yaml
  echo "✅ CronJob 설정 완료"
else
  echo "⏭️  CronJob 건너뜀"
fi


# 배포 상태 확인
echo ""
echo "=========================================="
echo "배포 상태 확인"
echo "=========================================="
echo ""
echo "📊 Pod 상태:"
kubectl get pods -n $NAMESPACE | grep monitoring-analysis || echo "아직 Pod가 생성 중입니다..."

echo ""
echo "🌐 Service 상태:"
kubectl get svc -n $NAMESPACE | grep monitoring-analysis

echo ""
echo "🔗 Ingress 상태:"
kubectl get ingress -n $NAMESPACE | grep monitoring-analysis || echo "Ingress가 아직 준비되지 않았습니다."

echo ""
echo "=========================================="
echo "배포 완료!"
echo "=========================================="
echo ""
echo "접속 URL:"
echo "  Frontend: http://monitoring.192.168.0.160.nip.io"
echo ""
echo "상태 확인 명령어:"
echo "  kubectl get pods -n $NAMESPACE | grep monitoring-analysis"
echo "  kubectl logs -n $NAMESPACE -l app=monitoring-analysis-backend --tail=50"
echo "  kubectl logs -n $NAMESPACE -l app=monitoring-analysis-frontend --tail=50"
echo ""

