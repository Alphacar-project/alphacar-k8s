# AWS CLI 설치 확인 및 설치 가이드

## 즉시 확인 필요

Jenkins 서버에서 AWS CLI가 설치되어 있는지 확인:

```bash
# AWS CLI 확인
which aws
aws --version

# 또는
/usr/local/bin/aws --version
/usr/bin/aws --version
```

## AWS CLI 설치 (필요시)

### 방법 1: apt를 통한 설치 (간단)

```bash
sudo apt-get update
sudo apt-get install -y awscli

# 확인
aws --version
```

### 방법 2: 최신 버전 설치 (권장)

```bash
# AWS CLI v2 설치
cd /tmp
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 확인
aws --version

# PATH 확인
which aws
```

## AWS 자격 증명 설정

EC2 인스턴스에 IAM 역할이 연결되어 있다면 자동으로 사용됩니다.
아니면 자격 증명을 설정해야 합니다:

```bash
aws configure
```

또는 환경 변수로:
```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=ap-northeast-2
```

## 테스트

```bash
# ECR 로그인 테스트
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin 382045063773.dkr.ecr.ap-northeast-2.amazonaws.com
```

