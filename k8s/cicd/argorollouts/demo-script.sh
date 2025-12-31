#!/bin/bash

# Blue-Green 배포 데모 스크립트
# 영상 촬영용 자동화 스크립트

set -e

NAMESPACE="apc-be-ns"
ROLLOUT_NAME="main-backend"
NEW_VERSION="${1:-1.0.33-demo}"  # 기본값 또는 첫 번째 인자
IMAGE_BASE="192.168.0.170:30000/alphacar/alphacar-main"

echo "🎬 Blue-Green 배포 데모 시작"
echo "================================"
echo ""

# 1. 현재 상태 확인
echo "📊 Step 1: 현재 Rollout 상태 확인"
echo "--------------------------------"
kubectl argo rollouts get rollout $ROLLOUT_NAME -n $NAMESPACE
echo ""
read -p "계속하려면 Enter를 누르세요..."

# 2. 새 버전 배포
echo ""
echo "🚀 Step 2: 새 버전 이미지 업데이트"
echo "--------------------------------"
echo "새 버전: $IMAGE_BASE:$NEW_VERSION"
kubectl argo rollouts set image $ROLLOUT_NAME \
  main-backend=$IMAGE_BASE:$NEW_VERSION \
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
kubectl get pods -n $NAMESPACE -l app=main-backend --show-labels
echo ""
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
else
    echo "전환을 취소했습니다."
fi

# 5. 최종 상태 확인
echo ""
echo "📊 Step 5: 최종 상태 확인"
echo "--------------------------------"
kubectl argo rollouts get rollout $ROLLOUT_NAME -n $NAMESPACE
echo ""
echo "✅ 데모 완료!"
echo ""
echo "💡 추가 명령어:"
echo "   - 롤백: kubectl argo rollouts undo $ROLLOUT_NAME -n $NAMESPACE"
echo "   - 상태 확인: kubectl argo rollouts get rollout $ROLLOUT_NAME -n $NAMESPACE"
echo "   - 실시간 모니터링: watch kubectl argo rollouts get rollout $ROLLOUT_NAME -n $NAMESPACE"

