#!/bin/bash

# Argo Rollouts Dashboard 시작 스크립트 (로컬 실행)

echo "🚀 Argo Rollouts Dashboard 시작..."
echo ""

# 기존 프로세스 중지
pkill -f "kubectl-argo-rollouts dashboard" 2>/dev/null || true
pkill -f "port-forward.*9003" 2>/dev/null || true
sleep 1

# Dashboard 시작 (로컬 실행)
echo "✅ Dashboard 시작 중..."
echo "   URL: http://localhost:9003"
echo ""

kubectl-argo-rollouts dashboard --port 9003 > /tmp/dashboard-9003.log 2>&1 &

sleep 3

# 상태 확인
if ps aux | grep -q "[k]ubectl-argo-rollouts dashboard"; then
    echo "✅ Dashboard가 실행 중입니다!"
    echo ""
    echo "📋 접속 정보:"
    echo "   - URL: http://localhost:9003"
    echo "   - 로그: /tmp/dashboard-9003.log"
    echo ""
    echo "🛑 중지: pkill -f 'kubectl-argo-rollouts dashboard'"
else
    echo "❌ Dashboard 시작 실패"
    echo "로그 확인: cat /tmp/dashboard-9003.log"
    exit 1
fi
