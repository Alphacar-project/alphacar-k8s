#!/bin/bash

# 포트 포워딩 중지 스크립트

echo "🛑 포트 포워딩 중지 중..."

pkill -f "port-forward.*9003" && echo "✅ 9003 포트 중지" || echo "ℹ️  9003 포트 실행 중이 아닙니다"
pkill -f "port-forward.*9001" && echo "✅ 9001 포트 중지" || echo "ℹ️  9001 포트 실행 중이 아닙니다"
pkill -f "port-forward.*9002" && echo "✅ 9002 포트 중지" || echo "ℹ️  9002 포트 실행 중이 아닙니다"

echo ""
echo "✅ 완료!"

