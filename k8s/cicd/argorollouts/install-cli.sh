#!/bin/bash

# kubectl-argo-rollouts CLI 설치 스크립트

set -e

echo "🚀 kubectl-argo-rollouts CLI 설치"
echo "================================"
echo ""

# 다운로드
echo "📥 다운로드 중..."
cd /tmp
curl -LO https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64

# 실행 권한 부여
chmod +x kubectl-argo-rollouts-linux-amd64

# 설치 위치 확인
INSTALL_PATH="/usr/local/bin/kubectl-argo-rollouts"
USER_PATH="$HOME/kubectl-argo-rollouts"

# sudo 권한 확인
if sudo -n true 2>/dev/null; then
    echo "📦 시스템 경로에 설치 중..."
    sudo mv kubectl-argo-rollouts-linux-amd64 $INSTALL_PATH
    echo "✅ 설치 완료: $INSTALL_PATH"
    INSTALLED_PATH=$INSTALL_PATH
else
    echo "📦 사용자 경로에 설치 중..."
    mv kubectl-argo-rollouts-linux-amd64 $USER_PATH
    echo "✅ 설치 완료: $USER_PATH"
    echo ""
    echo "⚠️  PATH에 추가하려면 다음을 ~/.bashrc에 추가하세요:"
    echo "   export PATH=\$PATH:\$HOME"
    INSTALLED_PATH=$USER_PATH
fi

# 버전 확인
echo ""
echo "🔍 설치 확인..."
$INSTALLED_PATH version

echo ""
echo "✅ 설치 완료!"
echo ""
echo "💡 사용법:"
if [ "$INSTALLED_PATH" != "$INSTALL_PATH" ]; then
    echo "   $INSTALLED_PATH set image rollouts-demo rollouts-demo=argoproj/rollouts-demo:green -n rollouts-demo"
    echo "   또는"
    echo "   export PATH=\$PATH:\$HOME"
    echo "   kubectl argo rollouts set image ..."
else
    echo "   kubectl argo rollouts set image rollouts-demo rollouts-demo=argoproj/rollouts-demo:green -n rollouts-demo"
fi

