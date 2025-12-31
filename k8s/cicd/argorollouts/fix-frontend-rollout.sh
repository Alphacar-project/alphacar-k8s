#!/bin/bash

# Frontend Rollout 문제 해결 스크립트

set -e

echo "🔧 Frontend Rollout 문제 해결"
echo "================================"
echo ""

# 1. KEDA ScaledObject 삭제 (Deployment 타겟)
echo "1️⃣ KEDA ScaledObject 삭제 중..."
kubectl delete scaledobject frontend-scaler -n apc-fe-ns 2>/dev/null || echo "   이미 삭제됨 또는 없음"
echo ""

# 2. VirtualService 업데이트
echo "2️⃣ VirtualService 업데이트 중..."
kubectl apply -f /home/alphacar/alphacar-final/k8s/frontend/alphacar-network.yaml
echo ""

# 3. Rollout 상태 확인
echo "3️⃣ Rollout 상태 확인..."
kubectl argo rollouts get rollout frontend -n apc-fe-ns
echo ""

# 4. Service 확인
echo "4️⃣ Service 확인..."
kubectl get svc -n apc-fe-ns | grep frontend
echo ""

echo "✅ 완료!"
echo ""
echo "💡 다음 단계:"
echo "   1. 새 버전 이미지 배포:"
echo "      kubectl argo rollouts set image frontend \\"
echo "        frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas \\"
echo "        -n apc-fe-ns"
echo ""
echo "   2. 브라우저에서 https://alphacar.cloud 접근하여 확인"

