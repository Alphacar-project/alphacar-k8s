# 챗봇 실행 가이드

## 빠른 시작

### 1. 환경 변수 설정

챗봇을 실행하기 전에 다음 환경 변수들을 설정해야 합니다:

```bash
# MongoDB 설정 (AI Chat 전용 계정)
export DATABASE_HOST=192.168.0.201
export DATABASE_PORT=27017
export DATABASE_USER=proj
export DATABASE_PASSWORD=1234
export DATABASE_NAME=alphacar

# 서비스 설정
export PORT=4000
export SERVICE_NAME=aichat-backend

# AWS Bedrock 설정 (AI 기능 사용 시 필요)
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export BEDROCK_GUARDRAIL_ID=your-guardrail-id
export BEDROCK_GUARDRAIL_VERSION=DRAFT
export BEDROCK_EMBEDDING_MODEL_ID=amazon.titan-embed-text-v1
export BEDROCK_MODEL_ID=amazon.titan-embed-text-v1
export BEDROCK_LLM_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

또는 `.env` 파일을 생성하여 설정할 수 있습니다:

```bash
cd /home/kevin/alphacar/dev/alphacar/backend/aichat
cat > .env << EOF
DATABASE_HOST=192.168.0.201
DATABASE_PORT=27017
DATABASE_USER=proj
DATABASE_PASSWORD=1234
DATABASE_NAME=alphacar
PORT=4000
SERVICE_NAME=aichat-backend
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
BEDROCK_GUARDRAIL_ID=your-guardrail-id
BEDROCK_GUARDRAIL_VERSION=DRAFT
BEDROCK_EMBEDDING_MODEL_ID=amazon.titan-embed-text-v1
BEDROCK_MODEL_ID=amazon.titan-embed-text-v1
BEDROCK_LLM_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
EOF
```

### 2. 의존성 설치 (필요한 경우)

```bash
cd /home/kevin/alphacar/dev/alphacar/backend/aichat
npm install
```

### 3. 챗봇 실행

#### 개발 모드 (자동 재시작)
```bash
npm run start:dev
```

#### 프로덕션 모드
```bash
# 먼저 빌드
npm run build

# 실행
npm run start:prod
```

#### 일반 실행
```bash
npm start
```

### 4. 확인

챗봇이 정상적으로 실행되면 다음과 같은 메시지가 표시됩니다:
```
AIChat Service is running on port 4000
```

서비스는 기본적으로 **포트 4000**에서 실행됩니다.

## 문제 해결

### MongoDB 연결 오류
- MongoDB 서버가 실행 중인지 확인
- 환경 변수 값이 올바른지 확인
- 네트워크 연결 확인

### AWS Bedrock 오류
- AWS 자격 증명이 올바른지 확인
- AWS 리전이 올바른지 확인
- Bedrock 서비스 접근 권한 확인

### 포트 충돌
- 다른 서비스가 4000 포트를 사용 중인지 확인
- `PORT` 환경 변수로 다른 포트 지정 가능

