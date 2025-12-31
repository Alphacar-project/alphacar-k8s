# AWS 자격 증명 설정 가이드

## 문제

```
Unable to locate credentials. You can configure credentials by running "aws login".
```

## 해결 방법

### 방법 1: EC2 IAM 역할 연결 (권장) ⭐

EC2 인스턴스에 IAM 역할을 연결하면 자동으로 자격 증명이 설정됩니다.

#### 1단계: IAM 역할 생성 (AWS Console)

1. **IAM** → **역할** → **역할 만들기**
2. **신뢰할 수 있는 엔티티 유형**: AWS 서비스 선택
3. **사용 사례**: EC2 선택
4. **권한 정책**: 다음 권한 추가
   - `AmazonEC2ContainerRegistryReadWrite` (ECR 읽기/쓰기)
   - 또는 필요한 ECR 권한 포함

#### 2단계: EC2 인스턴스에 역할 연결

1. **EC2** → **인스턴스** → Jenkins 서버 인스턴스 선택
2. **작업** → **보안** → **IAM 역할 수정**
3. 생성한 IAM 역할 선택
4. **업데이트**

#### 3단계: 확인

```bash
# 인스턴스 메타데이터에서 역할 확인
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# AWS CLI 테스트
aws ecr get-login-password --region ap-northeast-2
```

### 방법 2: AWS 자격 증명 파일 설정

IAM 역할을 사용할 수 없는 경우:

```bash
# AWS 자격 증명 디렉토리 생성
mkdir -p ~/.aws

# 자격 증명 파일 생성
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = YOUR_ACCESS_KEY_ID
aws_secret_access_key = YOUR_SECRET_ACCESS_KEY
EOF

# 설정 파일 생성
cat > ~/.aws/config << EOF
[default]
region = ap-northeast-2
output = json
EOF

# 권한 설정 (보안)
chmod 600 ~/.aws/credentials
chmod 600 ~/.aws/config
```

### 방법 3: 환경 변수 설정

```bash
export AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION=ap-northeast-2
```

Jenkins에서 사용하려면 Jenkinsfile의 environment 섹션에 추가:
```groovy
environment {
    AWS_ACCESS_KEY_ID = credentials('aws-access-key-id')
    AWS_SECRET_ACCESS_KEY = credentials('aws-secret-access-key')
}
```

## 필요한 IAM 권한

ECR을 사용하려면 최소한 다음 권한이 필요합니다:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload"
            ],
            "Resource": "*"
        }
    ]
}
```

또는 AWS 관리형 정책 사용:
- `AmazonEC2ContainerRegistryPowerUser` (읽기/쓰기)
- `AmazonEC2ContainerRegistryFullAccess` (모든 권한)

## 권장 방법

**EC2 IAM 역할 연결**을 강력히 권장합니다:
- ✅ 보안: 자격 증명 파일 불필요
- ✅ 관리 편의: 중앙 집중식 권한 관리
- ✅ 자동 갱신: 역할 자격 증명 자동 갱신
- ✅ Jenkins와 공유: EC2에서 실행되는 모든 프로세스에서 사용 가능

## 확인 방법

```bash
# 1. IAM 역할 확인
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# 2. AWS CLI 테스트
aws sts get-caller-identity

# 3. ECR 접근 테스트
aws ecr get-login-password --region ap-northeast-2

# 4. ECR 리포지토리 목록 확인
aws ecr describe-repositories --region ap-northeast-2
```

