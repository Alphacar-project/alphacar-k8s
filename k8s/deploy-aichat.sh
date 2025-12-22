#!/bin/bash

# AI Chat 챗봇 Kubernetes 배포 스크립트
# 사용법: ./deploy-aichat.sh

set -e

NAMESPACE="alphacar"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 AI Chat 챗봇 Kubernetes 배포를 시작합니다..."

# 1. Namespace 확인/생성
echo "📦 1. Namespace 확인/생성..."
kubectl apply -f "${SCRIPT_DIR}/namespace/namespace.yaml"

# 2. ConfigMap 배포
echo "📝 2. ConfigMap 배포..."
kubectl apply -f "${SCRIPT_DIR}/configmap-secret/configmap-env.yaml"

# 3. Secret 배포
echo "🔐 3. Secret 배포..."
kubectl apply -f "${SCRIPT_DIR}/configmap-secret/secret-db.yaml"
kubectl apply -f "${SCRIPT_DIR}/configmap-secret/secret-aws-bedrock.yaml"

# 4. Harbor Registry Secret 확인
echo "🐳 4. Harbor Registry Secret 확인..."
if ! kubectl get secret harbor-registry-secret -n "${NAMESPACE}" &>/dev/null; then
    echo "⚠️  Harbor Registry Secret이 없습니다."
    echo "다음 명령어로 생성하세요:"
    echo "kubectl create secret docker-registry harbor-registry-secret \\"
    echo "  --docker-server=192.168.0.169 \\"
    echo "  --docker-username=<your-username> \\"
    echo "  --docker-password=<your-password> \\"
    echo "  --namespace=${NAMESPACE}"
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 5. AI Chat Backend 배포
echo "🤖 5. AI Chat Backend 배포..."
kubectl apply -f "${SCRIPT_DIR}/backend/aichat-backend.yaml"

# 6. 배포 상태 확인
echo "✅ 6. 배포 상태 확인..."
echo ""
echo "Pod 상태:"
kubectl get pods -n "${NAMESPACE}" -l app=aichat-backend

echo ""
echo "Service 상태:"
kubectl get svc -n "${NAMESPACE}" aichat-backend

echo ""
echo "ConfigMap 상태:"
kubectl get configmap -n "${NAMESPACE}" alphacar-env

echo ""
echo "Secret 상태:"
kubectl get secrets -n "${NAMESPACE}" | grep -E "(mongodb|aws|jwt)"

echo ""
echo "✨ 배포가 완료되었습니다!"
echo ""
echo "📊 다음 명령어로 상태를 확인하세요:"
echo "  kubectl get pods -n ${NAMESPACE} -l app=aichat-backend"
echo "  kubectl logs -n ${NAMESPACE} -l app=aichat-backend -f"

