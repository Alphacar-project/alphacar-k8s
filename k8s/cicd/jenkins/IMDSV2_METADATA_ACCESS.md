# IMDSv2 메타데이터 접근 방법

## 문제

```
HTTP/1.1 401 Unauthorized
```

EC2 인스턴스의 메타데이터 서비스가 IMDSv2를 사용하도록 설정되어 있을 수 있습니다.

## 해결 방법: IMDSv2 토큰 사용

### 방법 1: IMDSv2 토큰으로 접근

```bash
# 1. 토큰 받기
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

# 2. 토큰으로 메타데이터 접근
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/

# 또는 한 번에
curl -H "X-aws-ec2-metadata-token: $(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")" http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

### 방법 2: IMDSv1으로 변경 (임시 해결책)

EC2 인스턴스의 메타데이터 옵션을 변경:

1. **EC2 Console** → **인스턴스** → Jenkins 서버 인스턴스 선택
2. **작업(Actions)** → **인스턴스 설정(Instance Settings)** → **메타데이터 옵션 수정(Modify metadata options)**
3. **메타데이터 액세스(Metadata access)** 섹션:
   - **메타데이터 버전(Metadata version)**: `V1 and V2 (recommended)` 또는 `V1 only` 선택
4. **저장(Save)** 클릭

### 방법 3: IMDSv2 필수 요구사항 변경

1. **EC2 Console** → **인스턴스** → 인스턴스 선택
2. **작업** → **인스턴스 설정** → **메타데이터 옵션 수정**
3. **메타데이터 버전**: `V1 and V2 (recommended)` 선택
4. **메타데이터 토큰 필수 요구사항**: `선택 사항(Optional)` 선택
5. **저장**

## 확인 명령어

### IMDSv2 토큰 사용:

```bash
# 토큰 받기 (6시간 유효)
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

# IAM 역할 확인
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/

# 자격 증명 확인
ROLE=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/)
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/$ROLE
```

### 한 줄 명령어:

```bash
# IAM 역할 확인
curl -H "X-aws-ec2-metadata-token: $(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")" http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

## AWS CLI와 IMDSv2

AWS CLI는 자동으로 IMDSv2를 처리하므로, AWS CLI를 사용하면 문제없이 작동합니다:

```bash
# AWS CLI는 자동으로 IMDSv2 토큰 처리
aws sts get-caller-identity
aws ecr get-login-password --region ap-northeast-2
```

## 권장 방법

1. **IMDSv2 토큰으로 확인** (위의 명령어 사용)
2. **AWS CLI 사용** (자동으로 IMDSv2 처리)
3. **메타데이터 옵션을 V1 and V2로 변경** (영구 해결)

## 스크립트 예시

```bash
#!/bin/bash

# IMDSv2 토큰 받기
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

# IAM 역할 확인
ROLE=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/)

if [ -z "$ROLE" ]; then
    echo "❌ IAM 역할이 연결되지 않았습니다"
else
    echo "✅ IAM 역할: $ROLE"
fi
```

