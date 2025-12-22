#!/bin/bash

# 멀티마스터 클러스터 자동 설정 스크립트
# 사용법: ./setup-multimaster.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
NAMESPACE="alphacar"

echo "=========================================="
echo "멀티마스터 클러스터 자동 설정"
echo "=========================================="
echo ""

# HAProxy IP 설정
HAPROXY_IP="192.168.0.178"

echo "📋 설정 정보:"
echo "  - HAProxy IP: $HAPROXY_IP"
echo "  - Namespace: $NAMESPACE"
echo ""

# 1. 시크릿 파일 확인
echo "1️⃣  시크릿 파일 확인 중..."
MISSING_SECRETS=0

if [ ! -f "$K8S_DIR/configmap-secret/secret-aws-bedrock.yaml" ]; then
  echo "❌ secret-aws-bedrock.yaml 파일이 없습니다."
  echo "   템플릿을 복사하고 SECRETS_FOR_MULTIMASTER.md의 값으로 수정하세요:"
  echo "   cp $K8S_DIR/configmap-secret/secret-aws-bedrock.yaml.template $K8S_DIR/configmap-secret/secret-aws-bedrock.yaml"
  MISSING_SECRETS=1
fi

if [ ! -f "$K8S_DIR/configmap-secret/secret-db.yaml" ]; then
  echo "❌ secret-db.yaml 파일이 없습니다."
  echo "   템플릿을 복사하고 SECRETS_FOR_MULTIMASTER.md의 값으로 수정하세요:"
  echo "   cp $K8S_DIR/configmap-secret/secret-db.yaml.template $K8S_DIR/configmap-secret/secret-db.yaml"
  MISSING_SECRETS=1
fi

if [ ! -f "$K8S_DIR/monitoring-analysis/secret.yaml" ]; then
  echo "❌ monitoring-analysis/secret.yaml 파일이 없습니다."
  echo "   템플릿을 복사하고 SECRETS_FOR_MULTIMASTER.md의 값으로 수정하세요:"
  echo "   cp $K8S_DIR/monitoring-analysis/secret.yaml.template $K8S_DIR/monitoring-analysis/secret.yaml"
  MISSING_SECRETS=1
fi

if [ $MISSING_SECRETS -eq 1 ]; then
  echo ""
  echo "⚠️  시크릿 파일을 먼저 생성하세요!"
  exit 1
fi

echo "✅ 모든 시크릿 파일이 준비되었습니다."
echo ""

# 2. 네임스페이스 확인/생성
echo "2️⃣  네임스페이스 확인 중..."
if kubectl get namespace $NAMESPACE &>/dev/null; then
  echo "✅ 네임스페이스가 이미 존재합니다."
else
  echo "📦 네임스페이스 생성 중..."
  kubectl apply -f "$K8S_DIR/namespace/namespace.yaml"
  echo "✅ 네임스페이스 생성 완료"
fi
echo ""

# 3. 멀티마스터 환경용 ConfigMap 사용
echo "3️⃣  ConfigMap 설정 중..."
if [ -f "$K8S_DIR/configmap-secret/configmap-env-multimaster.yaml" ]; then
  kubectl apply -f "$K8S_DIR/configmap-secret/configmap-env-multimaster.yaml"
  echo "✅ 멀티마스터 환경용 ConfigMap 적용 완료"
else
  echo "⚠️  멀티마스터용 ConfigMap이 없습니다. 기본 ConfigMap 사용 (IP 자동 변경)..."
  # 기본 ConfigMap의 IP 주소를 멀티마스터 환경에 맞게 수정
  sed "s/192.168.0.160/$HAPROXY_IP/g" "$K8S_DIR/configmap-secret/configmap-env.yaml" | \
  sed "s/192.168.56.200/$HAPROXY_IP/g" | kubectl apply -f -
  echo "✅ ConfigMap 적용 완료 (IP 주소 자동 변경)"
fi
echo ""

# 4. Monitoring Analysis ConfigMap
echo "4️⃣  Monitoring Analysis ConfigMap 설정 중..."
kubectl apply -f "$K8S_DIR/monitoring-analysis/configmap.yaml"
echo "✅ Monitoring Analysis ConfigMap 적용 완료"
echo ""

# 5. 시크릿 배포
echo "5️⃣  시크릿 배포 중..."
kubectl apply -f "$K8S_DIR/configmap-secret/secret-aws-bedrock.yaml"
kubectl apply -f "$K8S_DIR/configmap-secret/secret-db.yaml"
kubectl apply -f "$K8S_DIR/monitoring-analysis/secret.yaml"
echo "✅ 모든 시크릿 배포 완료"
echo ""

# 6. Harbor Registry Secret 확인
echo "6️⃣  Harbor Registry Secret 확인 중..."
if kubectl get secret harbor-registry-secret -n $NAMESPACE &>/dev/null; then
  echo "✅ Harbor Registry Secret이 이미 존재합니다."
else
  echo "⚠️  Harbor Registry Secret이 없습니다."
  echo "   다음 명령어로 생성하세요:"
  echo "   kubectl create secret docker-registry harbor-registry-secret \\"
  echo "     --docker-server=192.168.0.169 \\"
  echo "     --docker-username=<your-username> \\"
  echo "     --docker-password=<your-password> \\"
  echo "     --namespace=$NAMESPACE"
fi
echo ""

# 7. Frontend Deployment IP 주소 수정
echo "7️⃣  Frontend Deployment 설정 중..."
if [ -f "$K8S_DIR/frontend/frontend-deployment-multimaster.yaml" ]; then
  kubectl apply -f "$K8S_DIR/frontend/frontend-deployment-multimaster.yaml"
  echo "✅ 멀티마스터용 Frontend Deployment 적용 완료"
elif [ -f "$K8S_DIR/frontend/frontend-deployment.yaml" ]; then
  # 멀티마스터 환경에 맞게 IP 주소 변경
  sed "s/192.168.56.200/$HAPROXY_IP/g" "$K8S_DIR/frontend/frontend-deployment.yaml" | \
  sed "s/192.168.0.160/$HAPROXY_IP/g" | kubectl apply -f -
  echo "✅ Frontend Deployment 적용 완료 (IP 주소 자동 변경)"
fi
echo ""

# 8. Backend Deployments IP 주소 수정
echo "8️⃣  Backend Deployments 설정 중..."
for backend_file in "$K8S_DIR/backend"/*-backend.yaml; do
  if [ -f "$backend_file" ]; then
    sed "s/192.168.56.200/$HAPROXY_IP/g" "$backend_file" | \
    sed "s/192.168.0.160/$HAPROXY_IP/g" | kubectl apply -f -
  fi
done
echo "✅ Backend Deployments 적용 완료 (IP 주소 자동 변경)"
echo ""

# 9. Monitoring Analysis 배포
echo "9️⃣  Monitoring Analysis 배포 중..."
kubectl apply -f "$K8S_DIR/monitoring-analysis/rbac.yaml"

# Ingress는 멀티마스터용 사용
if [ -f "$K8S_DIR/monitoring-analysis/ingress-multimaster.yaml" ]; then
  kubectl apply -f "$K8S_DIR/monitoring-analysis/ingress-multimaster.yaml"
else
  # 기본 Ingress의 IP 주소를 멀티마스터 환경에 맞게 수정
  sed "s/192.168.0.160/$HAPROXY_IP/g" "$K8S_DIR/monitoring-analysis/ingress.yaml" | kubectl apply -f -
fi

kubectl apply -f "$K8S_DIR/monitoring-analysis/backend/service.yaml"
kubectl apply -f "$K8S_DIR/monitoring-analysis/backend/deployment.yaml"
kubectl apply -f "$K8S_DIR/monitoring-analysis/frontend/service.yaml"
kubectl apply -f "$K8S_DIR/monitoring-analysis/frontend/deployment.yaml"
kubectl apply -f "$K8S_DIR/monitoring-analysis/frontend/config.yaml"
kubectl apply -f "$K8S_DIR/monitoring-analysis/cronjob.yaml"
echo "✅ Monitoring Analysis 배포 완료"
echo ""

# 10. 배포 상태 확인
echo "=========================================="
echo "배포 상태 확인"
echo "=========================================="
echo ""
echo "📊 Pod 상태:"
kubectl get pods -n $NAMESPACE | head -10
echo ""
echo "🌐 Service 상태:"
kubectl get svc -n $NAMESPACE | grep -E "monitoring-analysis|frontend|backend" | head -10
echo ""
echo "🔗 Ingress 상태:"
kubectl get ingress -n $NAMESPACE | grep monitoring-analysis || echo "Ingress가 아직 준비되지 않았습니다."
echo ""

echo "=========================================="
echo "✅ 멀티마스터 클러스터 설정 완료!"
echo "=========================================="
echo ""
echo "📝 접속 정보:"
echo "  - Monitoring Dashboard: http://monitoring.$HAPROXY_IP.nip.io"
echo "  - Frontend: http://$HAPROXY_IP.nip.io (또는 Ingress 설정에 따라)"
echo ""
echo "📋 다음 단계:"
echo "  1. Pod가 모두 Running 상태인지 확인: kubectl get pods -n $NAMESPACE"
echo "  2. 로그 확인: kubectl logs -n $NAMESPACE -l app=monitoring-analysis-backend --tail=50"
echo "  3. 외부 서비스 연결 확인 (MongoDB, Redis, MariaDB)"
echo ""

