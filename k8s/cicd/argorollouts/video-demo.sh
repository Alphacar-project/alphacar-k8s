#!/bin/bash

# Blue-Green 배포 영상 촬영용 자동화 스크립트

set -e

echo "🎬 Blue-Green 배포 영상 촬영 스크립트"
echo "======================================"
echo ""

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Part 1: Frontend 롤백 시연
echo -e "${BLUE}=== Part 1: Frontend 롤백 시연 ===${NC}"
echo ""

echo "📊 Step 1: 현재 상태 확인"
echo "--------------------------------"
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns
echo ""
echo "🌐 브라우저에서 https://alphacar.cloud 접근하여 확인하세요"
echo "   → 'Hello 크리스마스 🎄' 텍스트 확인"
read -p "계속하려면 Enter를 누르세요..."

echo ""
echo "🔄 Step 2: 롤백 실행"
echo "--------------------------------"
echo "이전 버전으로 롤백합니다..."
kubectl-argo-rollouts undo frontend -n apc-fe-ns
echo ""
echo "⏳ 롤백 진행 중..."
sleep 10

echo ""
echo "📊 Step 3: 롤백 상태 확인"
echo "--------------------------------"
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns
echo ""
read -p "Preview 버전 확인 후 Enter를 누르세요..."

echo ""
echo "✅ Step 4: Promote (프로덕션 전환)"
echo "--------------------------------"
read -p "프로덕션으로 전환하시겠습니까? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kubectl-argo-rollouts promote frontend -n apc-fe-ns
    echo ""
    echo "⏳ 전환 진행 중..."
    sleep 5
    kubectl-argo-rollouts get rollout frontend -n apc-fe-ns
    echo ""
    echo "🌐 브라우저에서 https://alphacar.cloud 접근하여 확인하세요"
    echo "   → 'Hello 크리스마스 🎄' 텍스트가 사라진 것 확인!"
else
    echo "전환을 취소했습니다."
fi

echo ""
echo -e "${GREEN}=== Part 2: Rollouts-demo 색상 변화 시연 ===${NC}"
echo ""

echo "📊 Step 5: Rollouts-demo 초기 상태 확인"
echo "--------------------------------"
kubectl-argo-rollouts get rollout rollouts-demo -n rollouts-demo
echo ""
echo "🌐 브라우저에서 http://localhost:9001 접근하여 확인하세요"
echo "   → 파란색 그리드 확인"
read -p "계속하려면 Enter를 누르세요..."

echo ""
echo "🟢 Step 6: Green 버전 배포"
echo "--------------------------------"
echo "Green 버전을 배포합니다..."
kubectl-argo-rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:green \
  -n rollouts-demo
echo ""
echo "⏳ Preview 버전 생성 대기 중..."
sleep 10

echo ""
echo "📊 Step 7: Preview 확인"
echo "--------------------------------"
kubectl-argo-rollouts get rollout rollouts-demo -n rollouts-demo
echo ""
echo "🌐 브라우저에서 확인:"
echo "   - http://localhost:9001 (Active/Blue) → 파란색"
echo "   - http://localhost:9002 (Preview/Green) → 초록색"
read -p "Preview 확인 후 Enter를 누르세요..."

echo ""
echo "✅ Step 8: Promote (Blue → Green 전환)"
echo "--------------------------------"
read -p "Green 버전으로 전환하시겠습니까? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kubectl-argo-rollouts promote rollouts-demo -n rollouts-demo
    echo ""
    echo "⏳ 전환 진행 중..."
    sleep 5
    kubectl-argo-rollouts get rollout rollouts-demo -n rollouts-demo
    echo ""
    echo "🌐 브라우저에서 http://localhost:9001 새로고침"
    echo "   → 파란색 → 초록색으로 변경 확인!"
else
    echo "전환을 취소했습니다."
fi

echo ""
echo "🔄 Step 9: 롤백 (Green → Blue 복구)"
echo "--------------------------------"
read -p "Blue 버전으로 롤백하시겠습니까? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kubectl-argo-rollouts undo rollouts-demo -n rollouts-demo
    echo ""
    echo "⏳ 롤백 진행 중..."
    sleep 5
    kubectl-argo-rollouts get rollout rollouts-demo -n rollouts-demo
    echo ""
    echo "🌐 브라우저에서 http://localhost:9001 새로고침"
    echo "   → 초록색 → 파란색으로 복구 확인!"
else
    echo "롤백을 취소했습니다."
fi

echo ""
echo "✅ 영상 촬영 시나리오 완료!"
echo ""
echo "💡 추가 명령어:"
echo "   - 상태 확인: kubectl-argo-rollouts get rollout <name> -n <namespace>"
echo "   - 리비전 확인: kubectl-argo-rollouts history <name> -n <namespace>"

