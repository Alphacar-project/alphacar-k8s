# AWS CLI 설치 위치 명확화

## 핵심 답변

**✅ EC2 서버(Jenkins가 실행되는 서버)에 설치해야 합니다!**

## 상세 설명

### Jenkins 동작 방식

```
┌─────────────────┐
│  Git 저장소     │  ← Jenkinsfile이 저장된 곳 (로컬 개발 머신 또는 GitHub)
│  (Jenkinsfile)  │
└────────┬────────┘
         │ 체크아웃 (git clone)
         ▼
┌─────────────────┐
│  EC2 인스턴스   │  ← Jenkins가 실행되는 곳
│                 │  ← Jenkinsfile의 명령어들이 실행되는 곳
│  - Jenkins      │  ← 여기에 AWS CLI 설치 필요!
│  - Docker       │
│  - 빌드 실행    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  AWS ECR        │  ← docker push로 이미지 푸시
└─────────────────┘
```

## 설치 위치

### ✅ EC2 서버에 설치 (필수)

- Jenkins가 실행되는 EC2 인스턴스
- Jenkinsfile의 `sh` 명령어들이 실행되는 서버
- Docker 빌드와 ECR 푸시가 실행되는 서버

**SSH 접속:**
```bash
# EC2 인스턴스에 SSH 접속
ssh ubuntu@<EC2_IP주소>

# 여기서 AWS CLI 설치
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### ❌ 로컬 개발 머신에 설치 (불필요)

- Jenkinsfile이 있는 로컬 머신
- Git 저장소를 관리하는 개발자 PC
- **여기서는 실행되지 않으므로 불필요**

## 확인 방법

### 1. Jenkins가 실행되는 서버 확인

Jenkins 대시보드에서:
- Jenkins 관리 → 시스템 정보
- "시스템 속성" 또는 "Environment variables"에서 호스트명/IP 확인

### 2. EC2 인스턴스에 SSH 접속

```bash
# EC2 인스턴스에 SSH 접속
ssh -i <키파일> ubuntu@<EC2_IP주소>

# 또는
ssh ubuntu@<EC2_퍼블릭_IP>
```

### 3. AWS CLI 설치 확인

```bash
# EC2에서 확인
which aws
aws --version

# 결과가 나오면 설치됨
```

## 요약

| 항목 | 위치 | 설명 |
|------|------|------|
| **AWS CLI 설치** | ✅ EC2 서버 | Jenkins가 실행되는 곳 |
| **IAM 역할 연결** | ✅ EC2 인스턴스 | AWS Console에서 설정 |
| **Jenkinsfile** | Git 저장소 | 어디에 있든 상관없음 (체크아웃되므로) |
| **빌드 실행** | ✅ EC2 서버 | Jenkinsfile 명령어 실행 위치 |

## 설치 순서 (EC2 서버에서)

```bash
# 1. EC2 인스턴스에 SSH 접속
ssh ubuntu@<EC2_IP>

# 2. AWS CLI 설치
cd /tmp
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 3. 확인
aws --version

# 4. IAM 역할 확인 (AWS Console에서 역할 연결 후)
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/

# 5. ECR 테스트
aws ecr get-login-password --region ap-northeast-2
```

