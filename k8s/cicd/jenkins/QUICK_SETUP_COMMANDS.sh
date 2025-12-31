#!/bin/bash
# EC2 서버에서 실행할 AWS CLI 설정 스크립트

set -e

echo "========================================="
echo "1. IAM 역할 확인"
echo "========================================="
ROLE=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/ 2>/dev/null || echo "")
if [ -z "$ROLE" ]; then
    echo "❌ IAM 역할이 연결되지 않았습니다!"
    echo "AWS Console에서 EC2 인스턴스에 'Jenkins-ECR-Role'을 연결하세요."
    echo "EC2 → 인스턴스 → 작업 → 보안 → IAM 역할 수정"
    exit 1
else
    echo "✅ IAM 역할: $ROLE"
fi

echo ""
echo "========================================="
echo "2. AWS CLI 설치"
echo "========================================="
if command -v aws &> /dev/null; then
    echo "✅ AWS CLI가 이미 설치되어 있습니다: $(aws --version)"
else
    echo "AWS CLI 설치 중..."
    cd /tmp
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    sudo ./aws/install
    rm -rf awscliv2.zip aws
    echo "✅ AWS CLI 설치 완료"
fi

echo ""
echo "========================================="
echo "3. AWS CLI 확인"
echo "========================================="
aws --version
which aws

echo ""
echo "========================================="
echo "4. AWS 자격 증명 확인"
echo "========================================="
aws sts get-caller-identity

echo ""
echo "========================================="
echo "5. ECR 접근 테스트"
echo "========================================="
if aws ecr get-login-password --region ap-northeast-2 > /dev/null 2>&1; then
    echo "✅ ECR 접근 성공!"
    echo ""
    echo "========================================="
    echo "✅ 모든 설정이 완료되었습니다!"
    echo "Jenkins 빌드를 실행할 수 있습니다."
    echo "========================================="
else
    echo "❌ ECR 접근 실패"
    echo "IAM 역할에 ECR 권한이 있는지 확인하세요."
    exit 1
fi

