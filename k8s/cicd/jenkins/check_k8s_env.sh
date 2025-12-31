#!/bin/bash

# Kubernetes 환경 확인 스크립트

echo "=========================================="
echo "EC2 환경 확인: Kubernetes vs 일반 EC2"
echo "=========================================="
echo ""

echo "1. kubectl 설치 확인:"
echo "----------------------------------------"
if command -v kubectl &> /dev/null; then
    echo "✅ kubectl 설치됨"
    kubectl version --client 2>&1 | head -5
else
    echo "❌ kubectl 없음 → Kubernetes 환경이 아님"
fi
echo ""

echo "2. Kubernetes 클러스터 연결 확인:"
echo "----------------------------------------"
if command -v kubectl &> /dev/null; then
    kubectl cluster-info 2>&1 | head -10
else
    echo "kubectl이 없어 확인 불가"
fi
echo ""

echo "3. Kubernetes 노드 확인:"
echo "----------------------------------------"
if command -v kubectl &> /dev/null; then
    kubectl get nodes 2>&1
else
    echo "kubectl이 없어 확인 불가"
fi
echo ""

echo "4. Kubernetes Pod 확인:"
echo "----------------------------------------"
if command -v kubectl &> /dev/null; then
    kubectl get pods --all-namespaces 2>&1 | head -10
else
    echo "kubectl이 없어 확인 불가"
fi
echo ""

echo "5. systemd 서비스 확인 (Jenkins):"
echo "----------------------------------------"
systemctl status jenkins --no-pager | head -10
echo ""

echo "6. Jenkins 설치 위치 확인:"
echo "----------------------------------------"
if [ -d "/var/lib/jenkins" ]; then
    echo "✅ /var/lib/jenkins 디렉토리 존재"
    echo "   → systemd 서비스로 설치됨"
else
    echo "❌ /var/lib/jenkins 없음"
fi
echo ""

echo "=========================================="
echo "결론"
echo "=========================================="
if command -v kubectl &> /dev/null; then
    echo "⚠️ Kubernetes 환경일 수 있음 (추가 확인 필요)"
else
    echo "✅ 일반 EC2 인스턴스"
    echo "   → Jenkins: systemd 서비스로 설치"
    echo "   → SonarQube: systemd 서비스로 설치 권장"
fi
echo ""

