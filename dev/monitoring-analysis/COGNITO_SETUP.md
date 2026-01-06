# Amazon Cognito 인증 설정 가이드

GenAI 대시보드에 Amazon Cognito 인증이 구현되었습니다. 관리자만 로그인하여 대시보드를 사용할 수 있습니다.

## 📋 설정 단계

### 1. 프론트엔드 Cognito 설정

`dev/monitoring-analysis/frontend/index.html` 파일에서 Cognito 설정을 업데이트하세요:

```javascript
const COGNITO_CONFIG = {
    UserPoolId: 'YOUR_USER_POOL_ID',  // 실제 User Pool ID로 변경 (예: us-east-1_XXXXXXXXX)
    ClientId: 'YOUR_APP_CLIENT_ID'    // 실제 App Client ID로 변경
};
```

**위치**: `index.html` 파일의 약 847번째 줄

### 2. Kubernetes Secret 생성

Cognito 정보를 Kubernetes Secret으로 생성합니다:

```bash
# Secret 생성 (예시 파일 기반)
kubectl create secret generic cognito-secret \
  --from-literal=user-pool-id='YOUR_USER_POOL_ID' \
  --from-literal=app-client-id='YOUR_APP_CLIENT_ID' \
  -n apc-obsv-ns
```

또는 예시 파일(`k8s/monitoring-analysis/cognito-secret-example.yaml`)을 수정 후:

```bash
kubectl apply -f k8s/monitoring-analysis/cognito-secret-example.yaml
```

### 3. 백엔드 패키지 설치

백엔드에 필요한 패키지를 설치합니다:

```bash
cd dev/monitoring-analysis/backend
npm install
```

설치되는 패키지:
- `jsonwebtoken`: JWT 토큰 검증
- `jwks-rsa`: JWKS (JSON Web Key Set) 클라이언트

### 4. 이미지 재빌드 및 배포

변경사항을 반영하기 위해 이미지를 재빌드하고 배포합니다:

```bash
# build.sh 스크립트 사용 (권장)
cd dev/monitoring-analysis
./build.sh 4.0.5

# 또는 수동으로 빌드 및 푸시
cd dev/monitoring-analysis/backend
npm install
docker build -t 382045063773.dkr.ecr.ap-northeast-2.amazonaws.com/alphacar/alphacar-monitoring-analysis-backend:4.0.5 .

cd ../frontend
docker build -t 382045063773.dkr.ecr.ap-northeast-2.amazonaws.com/alphacar/alphacar-monitoring-analysis-frontend:4.0.5 .

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 382045063773.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 푸시
docker push 382045063773.dkr.ecr.ap-northeast-2.amazonaws.com/alphacar/alphacar-monitoring-analysis-backend:4.0.5
docker push 382045063773.dkr.ecr.ap-northeast-2.amazonaws.com/alphacar/alphacar-monitoring-analysis-frontend:4.0.5

# Kubernetes 배포 업데이트
kubectl set image deployment/monitoring-analysis-backend backend=382045063773.dkr.ecr.ap-northeast-2.amazonaws.com/alphacar/alphacar-monitoring-analysis-backend:4.0.5 -n apc-obsv-ns
kubectl set image deployment/monitoring-analysis-frontend frontend=382045063773.dkr.ecr.ap-northeast-2.amazonaws.com/alphacar/alphacar-monitoring-analysis-frontend:4.0.5 -n apc-obsv-ns
```

## 🔐 Cognito User Pool 설정 확인 사항

1. **관리자 그룹 생성 확인**
   - User Pool → Groups → `admin` 그룹이 존재하는지 확인
   - 관리자 사용자가 `admin` 그룹에 속해 있는지 확인

2. **App Client 설정 확인**
   - 클라이언트 시크릿 생성: **비활성화** (JavaScript SDK 사용 시 필수)
   - 인증 플로우: SRP (Secure Remote Password) - 기본값 사용

3. **사용자 상태 확인**
   - 관리자 사용자의 상태가 `CONFIRMED`인지 확인
   - 임시 비밀번호를 사용하는 경우, 첫 로그인 시 새 비밀번호 설정 필요

## 🚀 사용 방법

1. 대시보드 접속 시 로그인 화면이 표시됩니다
2. Cognito User Pool의 관리자 계정으로 로그인
3. `admin` 그룹에 속한 사용자만 접근 가능
4. 로그인 후 대시보드 사용 가능
5. 헤더의 "로그아웃" 버튼으로 로그아웃 가능

## 🔍 문제 해결

### 로그인 실패
- 사용자명/비밀번호 확인
- 사용자 상태가 CONFIRMED인지 확인
- 사용자가 `admin` 그룹에 속해 있는지 확인

### "관리자 권한이 없습니다" 오류
- Cognito User Pool에서 사용자를 `admin` 그룹에 추가
- 로그아웃 후 다시 로그인

### 토큰 검증 오류
- 백엔드 로그 확인: `kubectl logs -f deployment/monitoring-analysis-backend -n apc-obsv-ns`
- Cognito 환경 변수가 올바르게 설정되었는지 확인
- Secret이 생성되어 있는지 확인: `kubectl get secret cognito-secret -n apc-obsv-ns`

### 프론트엔드에서 "Cognito SDK가 로드되지 않았습니다"
- 브라우저 콘솔에서 네트워크 오류 확인
- CDN 접근 가능 여부 확인

## 📝 참고사항

- 토큰은 localStorage에 저장됩니다
- 토큰 만료 시 자동으로 로그인 화면이 표시됩니다
- 모든 API 호출 시 Authorization 헤더에 토큰이 자동으로 포함됩니다
- 백엔드 `/api/auth/verify` 엔드포인트에서 관리자 권한을 확인합니다
