#!/bin/bash

# 영상 촬영 준비 스크립트

echo "🎬 영상 촬영 준비"
echo "=================="
echo ""

# 1. Argo Rollouts 대시보드 확인
echo "1️⃣ Argo Rollouts 대시보드 확인"
echo "--------------------------------"
if pgrep -f "kubectl.*argo.*rollouts.*dashboard" > /dev/null; then
    echo "✅ 대시보드가 실행 중입니다"
else
    echo "⚠️ 대시보드가 실행되지 않았습니다"
    echo "   다음 명령어로 실행하세요:"
    echo "   kubectl-argo-rollouts dashboard"
fi
echo ""

# 2. Rollouts-demo Port Forward 확인
echo "2️⃣ Rollouts-demo Port Forward 확인"
echo "--------------------------------"
if pgrep -f "port-forward.*rollouts-demo-active.*8081" > /dev/null; then
    echo "✅ Active 서비스 Port Forward 실행 중 (8081)"
else
    echo "⚠️ Port Forward가 실행되지 않았습니다"
    echo "   다음 명령어로 실행하세요:"
    echo "   kubectl port-forward -n rollouts-demo svc/rollouts-demo-active 8081:80"
fi

if pgrep -f "port-forward.*rollouts-demo-preview.*8082" > /dev/null; then
    echo "✅ Preview 서비스 Port Forward 실행 중 (8082)"
else
    echo "⚠️ Preview Port Forward가 실행되지 않았습니다"
    echo "   다음 명령어로 실행하세요:"
    echo "   kubectl port-forward -n rollouts-demo svc/rollouts-demo-preview 8082:80"
fi
echo ""

# 3. Frontend 상태 확인
echo "3️⃣ Frontend Rollout 상태"
echo "--------------------------------"
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns | head -10
echo ""

# 4. Rollouts-demo 상태 확인
echo "4️⃣ Rollouts-demo Rollout 상태"
echo "--------------------------------"
kubectl-argo-rollouts get rollout rollouts-demo -n rollouts-demo | head -10
echo ""

# 5. 브라우저 접근 URL
echo "5️⃣ 브라우저 접근 URL"
echo "--------------------------------"
echo "📱 Frontend:"
echo "   - 프로덕션: https://alphacar.cloud"
echo "   - Preview: http://localhost:8083 (port-forward 필요)"
echo ""
echo "🎨 Rollouts-demo:"
echo "   - Active: http://localhost:8081"
echo "   - Preview: http://localhost:8082"
echo ""

# 6. 명령어 요약
echo "6️⃣ 주요 명령어"
echo "--------------------------------"
echo "Frontend 롤백:"
echo "  kubectl-argo-rollouts undo frontend -n apc-fe-ns"
echo "  kubectl-argo-rollouts promote frontend -n apc-fe-ns"
echo ""
echo "Rollouts-demo 색상:"
echo "  kubectl-argo-rollouts set image rollouts-demo rollouts-demo=argoproj/rollouts-demo:green -n rollouts-demo"
echo "  kubectl-argo-rollouts promote rollouts-demo -n rollouts-demo"
echo "  kubectl-argo-rollouts undo rollouts-demo -n rollouts-demo"
echo ""

echo "✅ 준비 완료!"
echo ""
echo "💡 자동화 스크립트 실행:"
echo "   ./video-demo.sh"

