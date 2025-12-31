#!/bin/bash

# ArgoCD와 Argo Rollouts 대시보드 접근 설정 스크립트

set -e

echo "🚀 대시보드 접근 설정"
echo "===================="
echo ""

# ArgoCD 네임스페이스 확인
if kubectl get namespace argocd &>/dev/null; then
    echo "✅ ArgoCD 네임스페이스 확인됨"
    ARGOCD_NS="argocd"
else
    echo "⚠️ ArgoCD 네임스페이스가 없습니다. 기본값 사용: argocd"
    ARGOCD_NS="argocd"
fi

# Argo Rollouts 네임스페이스 확인
if kubectl get namespace argo-rollouts &>/dev/null; then
    echo "✅ Argo Rollouts 네임스페이스 확인됨"
    ROLLOUTS_NS="argo-rollouts"
else
    echo "⚠️ Argo Rollouts 네임스페이스가 없습니다. 설치가 필요합니다."
    echo "   ./install-argo-rollouts.sh 실행 후 다시 시도하세요."
    exit 1
fi

echo ""
echo "📊 대시보드 접근 방법:"
echo ""

# ArgoCD 접근 방법
echo "1️⃣ ArgoCD 대시보드:"
ARGOCD_SVC=$(kubectl get svc -n $ARGOCD_NS -l app.kubernetes.io/name=argocd-server -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "argocd-server")
if [ -n "$ARGOCD_SVC" ] && [ "$ARGOCD_SVC" != "argocd-server" ] || kubectl get svc -n $ARGOCD_NS argocd-server &>/dev/null; then
    echo "   Port Forward:"
    echo "   kubectl port-forward -n $ARGOCD_NS svc/$ARGOCD_SVC 8080:443"
    echo "   브라우저: https://localhost:8080"
    echo ""
    
    # NodePort 확인
    NODEPORT=$(kubectl get svc -n $ARGOCD_NS $ARGOCD_SVC -o jsonpath='{.spec.ports[?(@.name=="server")].nodePort}' 2>/dev/null || echo "")
    if [ -n "$NODEPORT" ] && [ "$NODEPORT" != "null" ]; then
        echo "   또는 NodePort: http://<node-ip>:$NODEPORT"
    fi
else
    echo "   ⚠️ ArgoCD 서비스를 찾을 수 없습니다."
fi

echo ""

# Argo Rollouts 접근 방법
echo "2️⃣ Argo Rollouts 대시보드:"
if kubectl get svc -n $ROLLOUTS_NS argo-rollouts-ui &>/dev/null; then
    echo "   Port Forward:"
    echo "   kubectl port-forward -n $ROLLOUTS_NS svc/argo-rollouts-ui 3100:3100"
    echo "   브라우저: http://localhost:3100"
    echo ""
    echo "   ⚠️ UI가 설치되지 않았다면 argo-rollouts-ui.yaml을 배포하세요."
else
    echo "   ⚠️ Argo Rollouts UI 서비스를 찾을 수 없습니다."
    echo "   kubectl apply -f argo-rollouts-ui.yaml 실행 후 다시 시도하세요."
fi

echo ""
echo "💡 동시 접근 방법:"
echo "   터미널 1: kubectl port-forward -n $ARGOCD_NS svc/$ARGOCD_SVC 8080:443"
echo "   터미널 2: kubectl port-forward -n $ROLLOUTS_NS svc/argo-rollouts-ui 3100:3100"
echo ""
echo "✅ 설정 완료!"

