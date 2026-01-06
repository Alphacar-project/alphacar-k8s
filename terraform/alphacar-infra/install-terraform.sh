#!/bin/bash
# Terraform 설치 스크립트

echo "=========================================="
echo "Terraform 설치"
echo "=========================================="
echo ""

# Terraform 버전 확인
if command -v terraform &> /dev/null; then
    echo "✅ Terraform이 이미 설치되어 있습니다:"
    terraform version
    exit 0
fi

echo "Terraform을 설치합니다..."
echo ""

# 설치 디렉토리 생성
INSTALL_DIR="$HOME/bin"
mkdir -p "$INSTALL_DIR"

# Terraform 다운로드 및 설치
TERRAFORM_VERSION="1.6.0"
ARCH="amd64"
OS="linux"

echo "다운로드 중: Terraform ${TERRAFORM_VERSION}..."
cd /tmp

wget -q "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_${OS}_${ARCH}.zip" -O terraform.zip

if [ $? -eq 0 ]; then
    echo "압축 해제 중..."
    unzip -q terraform.zip
    mv terraform "$INSTALL_DIR/"
    chmod +x "$INSTALL_DIR/terraform"
    rm terraform.zip
    
    # PATH에 추가 (현재 세션용)
    export PATH="$INSTALL_DIR:$PATH"
    
    # .bashrc에 추가 (영구적)
    if ! grep -q "$INSTALL_DIR" ~/.bashrc; then
        echo "" >> ~/.bashrc
        echo "# Terraform" >> ~/.bashrc
        echo "export PATH=\"\$HOME/bin:\$PATH\"" >> ~/.bashrc
    fi
    
    echo ""
    echo "✅ Terraform 설치 완료!"
    echo ""
    echo "설치된 버전:"
    "$INSTALL_DIR/terraform" version
    echo ""
    echo "⚠️  다음을 실행하여 PATH를 업데이트하세요:"
    echo "   source ~/.bashrc"
    echo "   또는"
    echo "   export PATH=\"\$HOME/bin:\$PATH\""
else
    echo "❌ 다운로드 실패"
    exit 1
fi
