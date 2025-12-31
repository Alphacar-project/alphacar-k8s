#!/bin/bash

# Hello 크리스마스 Blue-Green 배포 데모 스크립트

set -e

NAMESPACE="apc-fe-ns"
ROLLOUT_NAME="frontend"
NEW_VERSION="${1:-1.0.054-christmas}"  # 기본값 또는 첫 번째 인자
IMAGE_BASE="192.168.0.170:30000/alphacar/frontend"

echo "🎄 Hello 크리스마스 Blue-Green 배포 데모"
echo "=========================================="
echo ""

# 1. 현재 상태 확인
echo "📊 Step 1: 현재 Rollout 상태 확인"
echo "--------------------------------"
kubectl argo rollouts get rollout $ROLLOUT_NAME -n $NAMESPACE
echo ""
echo "🌐 브라우저에서 https://alphacar.cloud 접근하여 확인하세요"
echo "   → 'Hello 크리스마스' 텍스트가 없는 상태"
read -p "계속하려면 Enter를 누르세요..."

# 2. 새 버전 배포
echo ""
echo "🚀 Step 2: 새 버전 이미지 업데이트 (Hello 크리스마스 포함)"
echo "--------------------------------"
echo "새 버전: $IMAGE_BASE:$NEW_VERSION"
kubectl argo rollouts set image $ROLLOUT_NAME \
  frontend=$IMAGE_BASE:$NEW_VERSION \
  -n $NAMESPACE
echo ""
echo "⏳ Preview 버전 생성 대기 중..."
sleep 10

# 3. Preview 상태 확인
echo ""
echo "📊 Step 3: Preview 버전 상태 확인"
echo "--------------------------------"
kubectl argo rollouts get rollout $ROLLOUT_NAME -n $NAMESPACE
echo ""
echo "🔍 Pod 상태:"
kubectl get pods -n $NAMESPACE -l app=frontend --show-labels
echo ""
echo "🧪 Preview 버전 테스트:"
echo "   kubectl port-forward -n $NAMESPACE svc/frontend-preview 8001:8000"
echo "   브라우저에서 http://localhost:8001 접근"
echo "   → 'Hello 크리스마스 🎄' 텍스트 확인!"
read -p "Preview 버전 확인 후 Enter를 누르세요..."

# 4. 승인 (Promote)
echo ""
echo "✅ Step 4: 새 버전으로 전환 (Promote)"
echo "--------------------------------"
read -p "새 버전을 프로덕션으로 전환하시겠습니까? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kubectl argo rollouts promote $ROLLOUT_NAME -n $NAMESPACE
    echo ""
    echo "⏳ 전환 진행 중..."
    sleep 5
    kubectl argo rollouts get rollout $ROLLOUT_NAME -n $NAMESPACE
    echo ""
    echo "🌐 브라우저에서 https://alphacar.cloud 접근하여 확인하세요"
    echo "   → 'Hello 크리스마스 🎄' 텍스트 확인!"
else
    echo "전환을 취소했습니다."
fi

# 5. 롤백 대기
echo ""
echo "🔄 Step 5: 롤백 시연"
echo "--------------------------------"
read -p "롤백을 실행하시겠습니까? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kubectl argo rollouts undo $ROLLOUT_NAME -n $NAMESPACE
    echo ""
    echo "⏳ 롤백 진행 중..."
    sleep 5
    kubectl argo rollouts get rollout $ROLLOUT_NAME -n $NAMESPACE
    echo ""
    echo "🌐 브라우저에서 https://alphacar.cloud 접근하여 확인하세요"
    echo "   → 'Hello 크리스마스 🎄' 텍스트가 사라진 것 확인!"
else
    echo "롤백을 취소했습니다."
fi

# 6. 최종 상태 확인
echo ""
echo "📊 Step 6: 최종 상태 확인"
echo "--------------------------------"
kubectl argo rollouts get rollout $ROLLOUT_NAME -n $NAMESPACE
echo ""
echo "✅ 데모 완료!"
echo ""
echo "💡 추가 명령어:"
echo "   - 상태 확인: kubectl argo rollouts get rollout $ROLLOUT_NAME -n $NAMESPACE"
echo "   - 리비전 확인: kubectl argo rollouts history $ROLLOUT_NAME -n $NAMESPACE"
echo "   - 실시간 모니터링: watch kubectl argo rollouts get rollout $ROLLOUT_NAME -n $NAMESPACE"

