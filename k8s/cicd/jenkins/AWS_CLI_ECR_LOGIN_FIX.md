# AWS CLI ECR 로그인 오류 해결

## 오류 메시지

```
aws: not found
Error: Cannot perform an interactive login from a non TTY device
```

## 문제점

1. **AWS CLI가 설치되지 않음** 또는 PATH에 없음
2. Jenkins에서 `aws` 명령어를 찾을 수 없음

## 해결 방법

### 옵션 1: AWS CLI 설치 확인 (EC2에서)

```bash
# AWS CLI 설치 확인
which aws
aws --version

# 설치되지 않았다면 설치
sudo apt-get update
sudo apt-get install -y awscli

# 또는 최신 버전 설치
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 옵션 2: Jenkinsfile에서 절대 경로 사용

AWS CLI가 설치되어 있지만 PATH 문제인 경우:
- `/usr/bin/aws` 또는 `/usr/local/bin/aws` 사용
- `which aws`로 확인 후 경로 사용

### 옵션 3: Jenkinsfile 수정 (권장)

Jenkinsfile에서 AWS CLI 경로를 명시적으로 지정:

```groovy
sh """
    AWS_CLI=\$(which aws || echo '/usr/local/bin/aws')
    \${AWS_CLI} ecr get-login-password --region \${AWS_REGION} | \\
    docker login --username AWS --password-stdin \${ECR_REGISTRY}
"""
```

또는:

```groovy
script {
    def awsPath = sh(script: 'which aws', returnStdout: true).trim()
    if (!awsPath) {
        error "AWS CLI not found. Please install AWS CLI."
    }
    sh """
        ${awsPath} ecr get-login-password --region ${AWS_REGION} | \\
        docker login --username AWS --password-stdin ${ECR_REGISTRY}
    """
}
```

