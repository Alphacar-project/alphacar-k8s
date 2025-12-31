#!/bin/bash

# Argo Rollouts 설치 스크립트

set -e

echo "🚀 Argo Rollouts 설치를 시작합니다..."

# 네임스페이스 생성
echo "📦 네임스페이스 생성 중..."
kubectl create namespace argo-rollouts --dry-run=client -o yaml | kubectl apply -f -

# Argo Rollouts 설치
echo "📥 Argo Rollouts 설치 중..."
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

# 설치 확인
echo "⏳ 설치 완료 대기 중..."
kubectl wait --for=condition=available --timeout=300s deployment/argo-rollouts -n argo-rollouts

echo "✅ Argo Rollouts 설치가 완료되었습니다!"

# 설치 상태 확인
echo ""
echo "📊 설치 상태:"
kubectl get pods -n argo-rollouts

echo ""
echo "💡 Argo Rollouts CLI 설치 방법:"
echo "   curl -LO https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64"
echo "   chmod +x ./kubectl-argo-rollouts-linux-amd64"
echo "   sudo mv ./kubectl-argo-rollouts-linux-amd64 /usr/local/bin/kubectl-argo-rollouts"
echo ""
echo "📊 Argo Rollouts UI 설치:"
echo "   kubectl apply -f argo-rollouts-ui.yaml"
echo ""
echo "🌐 UI 접근 방법:"
echo "   kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 3100:3100"
echo "   브라우저에서 http://localhost:3100 접근"

