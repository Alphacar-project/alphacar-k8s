#!/bin/bash

# 8080 포트 포워딩 스크립트

echo "=== 8080 포트 포워딩 옵션 ==="
echo ""
echo "1. Rollouts-demo (Blue-Green 색상 변화 확인)"
echo "   kubectl port-forward -n rollouts-demo svc/rollouts-demo-active 8080:80 --address=0.0.0.0"
echo ""
echo "2. Frontend Stable 서비스"
echo "   kubectl port-forward -n apc-fe-ns svc/frontend-stable 8080:8000 --address=0.0.0.0"
echo ""
echo "3. Argo Rollouts Dashboard"
echo "   kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 8080:3100 --address=0.0.0.0"
echo ""

# 사용자 선택
read -p "어떤 서비스를 포트 포워딩하시겠습니까? (1/2/3): " choice

case $choice in
    1)
        echo "Rollouts-demo 포트 포워딩 시작..."
        kubectl port-forward -n rollouts-demo svc/rollouts-demo-active 8080:80 --address=0.0.0.0
        ;;
    2)
        echo "Frontend Stable 포트 포워딩 시작..."
        kubectl port-forward -n apc-fe-ns svc/frontend-stable 8080:8000 --address=0.0.0.0
        ;;
    3)
        echo "Argo Rollouts Dashboard 포트 포워딩 시작..."
        kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 8080:3100 --address=0.0.0.0
        ;;
    *)
        echo "잘못된 선택입니다."
        exit 1
        ;;
esac

