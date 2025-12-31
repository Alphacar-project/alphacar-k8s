#!/bin/bash

# 포트 포워딩 시작 스크립트 (새 포트 번호)

echo "🚀 포트 포워딩 시작..."
echo ""

# 기존 포트 포워딩 중지
echo "기존 포트 포워딩 중지 중..."
pkill -f "port-forward.*9000" || true
pkill -f "port-forward.*9001" || true
pkill -f "port-forward.*9002" || true
sleep 1

# Argo Rollouts Dashboard (9003)
echo "✅ Argo Rollouts Dashboard: http://localhost:9003"
pkill -f "port-forward.*9003" 2>/dev/null || true
sleep 1
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 9003:3100 --address=0.0.0.0 > /dev/null 2>&1 &
sleep 1

# Blue (rollouts-demo-active) - 9001
echo "✅ Blue (Active): http://localhost:9001"
pkill -f "port-forward.*9001" 2>/dev/null || true
sleep 1
kubectl port-forward -n rollouts-demo svc/rollouts-demo-active 9001:80 --address=0.0.0.0 > /dev/null 2>&1 &
sleep 1

# Green (rollouts-demo-preview) - 9002
echo "✅ Green (Preview): http://localhost:9002"
pkill -f "port-forward.*9002" 2>/dev/null || true
sleep 1
kubectl port-forward -n rollouts-demo svc/rollouts-demo-preview 9002:80 --address=0.0.0.0 > /dev/null 2>&1 &
sleep 1

echo ""
echo "✅ 모든 포트 포워딩이 시작되었습니다!"
echo ""
echo "📋 접속 정보:"
echo "   - Argo Rollouts Dashboard: http://localhost:9003"
echo "   - Blue (Active): http://localhost:9001"
echo "   - Green (Preview): http://localhost:9002"
echo ""
echo "💡 포트 포워딩 중지: ./stop-ports.sh"

