# AWS CLI 설치 완료 가이드

## 현재 상태

✅ **IAM 역할 확인 성공**: `Jenkins-ECR-Role`
⏳ **AWS CLI 설치 필요**: unzip 패키지 필요

## 설치 명령어

### 1단계: unzip 설치

```bash
sudo apt-get update
sudo apt-get install -y unzip
```

### 2단계: AWS CLI 설치

```bash
cd /tmp
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws
```

### 3단계: 확인

```bash
# AWS CLI 버전 확인
aws --version

# 경로 확인
which aws

# AWS 자격 증명 확인
aws sts get-caller-identity

# ECR 접근 테스트
aws ecr get-login-password --region ap-northeast-2
```

## 예상 결과

### AWS CLI 버전 확인:
```
aws-cli/2.x.x Python/3.x.x Linux/x.x.x-x-generic exe/x86_64.ubuntu.24
```

### 자격 증명 확인:
```json
{
    "UserId": "AROAXXXXXXXXXXXXXXXXX:i-xxxxxxxxxxxxx",
    "Account": "382045063773",
    "Arn": "arn:aws:sts::382045063773:assumed-role/Jenkins-ECR-Role/i-xxxxxxxxxxxxx"
}
```

### ECR 접근 테스트:
```
토큰 문자열이 출력되면 성공!
```

## 전체 설치 스크립트 (한 번에 실행)

```bash
#!/bin/bash
set -e

echo "=== 1. unzip 설치 ==="
sudo apt-get update
sudo apt-get install -y unzip

echo ""
echo "=== 2. AWS CLI 설치 ==="
cd /tmp
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws

echo ""
echo "=== 3. 확인 ==="
aws --version
which aws

echo ""
echo "=== 4. AWS 자격 증명 확인 ==="
aws sts get-caller-identity

echo ""
echo "=== 5. ECR 접근 테스트 ==="
if aws ecr get-login-password --region ap-northeast-2 > /dev/null 2>&1; then
    echo "✅ ECR 접근 성공!"
    echo ""
    echo "========================================="
    echo "✅ 모든 설정이 완료되었습니다!"
    echo "Jenkins 빌드를 실행할 수 있습니다."
    echo "========================================="
else
    echo "❌ ECR 접근 실패"
    exit 1
fi
```

## 설치 완료 후

1. ✅ IAM 역할 연결 확인됨: `Jenkins-ECR-Role`
2. ✅ AWS CLI 설치
3. ✅ ECR 접근 테스트
4. ✅ Jenkins 빌드 실행 가능

## 다음 단계

Jenkins 대시보드에서 빌드를 실행하면:
- Docker 빌드 성공
- AWS CLI로 ECR 로그인 성공
- ECR에 이미지 푸시 성공

