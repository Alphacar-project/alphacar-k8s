# IAM 역할 및 AWS CLI 설정 확인

## 현재 상황

1. IAM 역할 확인 결과가 비어있음 → 역할이 연결되지 않았을 가능성
2. AWS CLI가 설치되지 않음

## 해결 단계

### 1단계: IAM 역할 확인

```bash
# IAM 역할 확인
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

**결과 해석:**
- 결과가 비어있거나 404: **IAM 역할이 연결되지 않음**
- 결과에 역할 이름이 나옴 (예: `Jenkins-ECR-Role`): **역할이 연결됨**

**역할이 연결되지 않은 경우:**
- AWS Console에서 EC2 인스턴스에 IAM 역할 연결 필요

### 2단계: AWS CLI 설치

```bash
# AWS CLI v2 설치
cd /tmp
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws

# 확인
aws --version
which aws
```

### 3단계: 전체 확인 스크립트

```bash
#!/bin/bash

echo "=== 1. IAM 역할 확인 ==="
ROLE=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/ 2>/dev/null)
if [ -z "$ROLE" ]; then
    echo "❌ IAM 역할이 연결되지 않았습니다!"
    echo "AWS Console에서 EC2 인스턴스에 IAM 역할을 연결하세요."
    exit 1
else
    echo "✅ IAM 역할: $ROLE"
fi

echo ""
echo "=== 2. AWS CLI 확인 ==="
if ! command -v aws &> /dev/null; then
    echo "⚠️ AWS CLI가 설치되지 않았습니다. 설치 중..."
    cd /tmp
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    sudo ./aws/install
    rm -rf awscliv2.zip aws
else
    echo "✅ AWS CLI: $(aws --version)"
fi

echo ""
echo "=== 3. AWS 자격 증명 확인 ==="
aws sts get-caller-identity

echo ""
echo "=== 4. ECR 접근 테스트 ==="
aws ecr get-login-password --region ap-northeast-2 && echo "✅ ECR 접근 성공!" || echo "❌ ECR 접근 실패"
```

## 중요: IAM 역할 연결이 필수

AWS CLI만 설치해서는 안 되고, **IAM 역할도 반드시 연결되어 있어야 합니다**.

IAM 역할 연결 방법:
1. AWS Console → EC2 → 인스턴스
2. Jenkins 서버 인스턴스 선택
3. 작업 → 보안 → IAM 역할 수정
4. Jenkins-ECR-Role 선택
5. 업데이트

