#!/bin/bash

# Frontend Preview Port Forward 스크립트

echo "🚀 Frontend Preview Port Forward 시작"
echo "================================"
echo ""

# 기존 port-forward 종료
pkill -f "port-forward.*frontend-preview.*8082" 2>/dev/null || true

# 모든 인터페이스에서 접근 가능하도록 설정
echo "📡 Port Forward 실행 중..."
echo "   Preview 서비스: frontend-preview"
echo "   로컬 포트: 8082"
echo "   서비스 포트: 8000"
echo ""
echo "🌐 접근 방법:"
echo "   - http://localhost:8082"
echo "   - http://192.168.0.170:8082 (같은 서버인 경우)"
echo ""
echo "종료하려면 Ctrl+C를 누르세요"
echo "================================"
echo ""

kubectl port-forward -n apc-fe-ns svc/frontend-preview --address=0.0.0.0 8082:8000

