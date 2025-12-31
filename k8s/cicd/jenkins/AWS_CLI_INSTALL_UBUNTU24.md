# Ubuntu 24.04 AWS CLI 설치 가이드

## 문제

Ubuntu 24.04에서는 `awscli` 패키지가 apt 저장소에서 제거되었습니다.
대신 AWS CLI v2를 직접 설치해야 합니다.

## 설치 방법

### 방법 1: AWS CLI v2 설치 (권장)

```bash
# 다운로드 및 설치
cd /tmp
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 확인
aws --version

# 경로 확인 (Jenkins에서 사용하기 위해)
which aws
# 결과: /usr/local/bin/aws
```

### 방법 2: 빠른 설치 (스크립트)

```bash
#!/bin/bash
# AWS CLI v2 설치 스크립트

cd /tmp
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws

# 확인
aws --version
which aws
```

## 확인

```bash
# 버전 확인
aws --version
# 예상 결과: aws-cli/2.x.x Python/3.x.x ...

# 경로 확인
which aws
# 예상 결과: /usr/local/bin/aws

# ECR 테스트 (IAM 역할이 설정되어 있어야 함)
aws ecr get-login-password --region ap-northeast-2
```

## IAM 역할 설정

EC2 인스턴스에 IAM 역할이 연결되어 있어야 합니다:
- 역할에 `AmazonEC2ContainerRegistryReadWrite` 정책이 있어야 함
- 또는 ECR 관련 권한이 필요

## Jenkinsfile과의 관계

Jenkinsfile에서는 다음 경로들을 자동으로 찾습니다:
1. `which aws` - PATH에서 찾기
2. `/usr/local/bin/aws` - 기본 설치 경로

AWS CLI v2를 설치하면 `/usr/local/bin/aws`에 설치되므로 Jenkinsfile이 자동으로 찾을 수 있습니다.

