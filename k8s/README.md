# 모니터링 분석 시스템 Kubernetes 배포 가이드

## 개요

메트릭/로그/트레이스를 Bedrock으로 분석하는 통합 모니터링 시스템입니다.

## Phase 1 & Phase 2 기능

### Phase 1
- ✅ 백엔드 API 서버
- ✅ Prometheus 연동 및 메트릭 분석
- ✅ Bedrock 통합
- ✅ 기본 웹 대시보드
- ✅ 자동 알림 시스템 (Slack)
- ✅ 실시간 스트리밍 (WebSocket)

### Phase 2
- ✅ 로그/트레이스 분석
- ✅ 그래프 시각화
- ✅ k6 부하테스트 통합
- ✅ 비교 분석
- ✅ 리포트 생성 (일일/주간)

## 파일 구조

```
k8s/
├── monitoring-analysis-secret.yaml              # Slack 웹훅 시크릿
├── monitoring-analysis-configmap.yaml           # 설정 ConfigMap
├── monitoring-analysis-backend-deployment.yaml  # Backend Deployment
├── monitoring-analysis-backend-service.yaml    # Backend Service
├── monitoring-analysis-frontend-deployment.yaml # Frontend Deployment
├── monitoring-analysis-frontend-service.yaml    # Frontend Service
├── monitoring-analysis-frontend-config.yaml     # Frontend Nginx 설정
├── monitoring-analysis-ingress.yaml             # Ingress 설정
├── monitoring-analysis-rbac.yaml               # RBAC 권한
├── monitoring-analysis-cronjob.yaml             # 리포트 생성 CronJob
├── k6-loadtest-job.yaml                        # k6 부하테스트 Job 템플릿
└── k6-scripts-configmap.yaml                   # k6 테스트 스크립트
```

## 배포 순서

### 1. 시크릿 및 ConfigMap 생성

```bash
kubectl apply -f monitoring-analysis-secret.yaml
kubectl apply -f monitoring-analysis-configmap.yaml
kubectl apply -f monitoring-analysis-frontend-config.yaml
kubectl apply -f k6-scripts-configmap.yaml
```

### 2. RBAC 설정

```bash
kubectl apply -f monitoring-analysis-rbac.yaml
```

### 3. Backend 배포

```bash
kubectl apply -f monitoring-analysis-backend-service.yaml
kubectl apply -f monitoring-analysis-backend-deployment.yaml
```

### 4. Frontend 배포

```bash
kubectl apply -f monitoring-analysis-frontend-service.yaml
kubectl apply -f monitoring-analysis-frontend-deployment.yaml
```

### 5. Ingress 설정

```bash
kubectl apply -f monitoring-analysis-ingress.yaml
```

### 6. CronJob 설정 (선택)

```bash
kubectl apply -f monitoring-analysis-cronjob.yaml
```

## 접속 URL

- Frontend: http://monitoring.192.168.0.160.nip.io
- Backend API: http://monitoring-analysis-backend:5000 (클러스터 내부)

## 환경 변수

### Backend 주요 환경 변수
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: Bedrock 인증
- `BEDROCK_MODEL_ID`: Bedrock 모델 ID (기존 챗봇 모델 재사용)
- `PROMETHEUS_URL`: Prometheus 서버 주소
- `SLACK_WEBHOOK_URL`: Slack 알림 웹훅
- `MONGO_HOST`, `MONGO_PORT`, `MONGO_DB_NAME`: MongoDB 연결 정보

## API 엔드포인트

### 분석 API
- `POST /api/analyze/metrics` - 메트릭 분석
- `POST /api/analyze/logs` - 로그 분석
- `POST /api/analyze/traces` - 트레이스 분석
- `GET /api/metrics/graph` - 메트릭 그래프 데이터

### 부하테스트 API
- `POST /api/loadtest/start` - k6 부하테스트 시작
- `GET /api/loadtest/status/:jobId` - 테스트 상태 조회

### 리포트 API
- `POST /api/reports/generate` - 리포트 생성
- `GET /api/reports/:reportId` - 리포트 다운로드

### WebSocket
- `ws://monitoring-analysis-backend:5000/ws` - 실시간 스트리밍

## k6 부하테스트 사용법

### 1. Job 직접 생성

```bash
kubectl create job k6-test-$(date +%s) \
  --from=job/k6-loadtest-template \
  -n alphacar
```

### 2. API를 통한 시작

```bash
curl -X POST http://monitoring-analysis-backend:5000/api/loadtest/start \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "loadtest.js",
    "duration": "5m",
    "vus": 20
  }'
```

## 알림 설정

Slack 웹훅이 자동으로 설정되어 있으며, Bedrock 분석 결과에서 다음 키워드가 감지되면 알림이 전송됩니다:

- **Critical**: 장애, 위험, 에러, 실패, 다운
- **Warning**: 주의, 경고, 느림, 지연

## 리포트 스케줄

- **일일 리포트**: 매일 오전 9시 자동 생성
- **주간 리포트**: 매주 월요일 오전 9시 자동 생성

## 모니터링

### 상태 확인

```bash
# Pod 상태 확인
kubectl get pods -n alphacar | grep monitoring-analysis

# 로그 확인
kubectl logs -n alphacar -l app=monitoring-analysis-backend --tail=50
kubectl logs -n alphacar -l app=monitoring-analysis-frontend --tail=50

# 서비스 확인
kubectl get svc -n alphacar | grep monitoring-analysis
```

### 헬스 체크

```bash
# Backend 헬스 체크
kubectl exec -n alphacar deployment/monitoring-analysis-backend -- curl http://localhost:5000/health
```

## 트러블슈팅

### Backend가 시작되지 않는 경우
1. Bedrock 시크릿 확인: `kubectl get secret aws-bedrock-secret -n alphacar`
2. ConfigMap 확인: `kubectl get configmap monitoring-analysis-config -n alphacar`
3. 로그 확인: `kubectl logs -n alphacar -l app=monitoring-analysis-backend`

### Frontend가 접속되지 않는 경우
1. Ingress 확인: `kubectl get ingress -n alphacar`
2. Traefik 라우팅 확인
3. Service 확인: `kubectl get svc monitoring-analysis-frontend -n alphacar`

## 다음 단계

1. **이미지 빌드**: 실제 애플리케이션 이미지 빌드 및 배포
2. **Loki/Jaeger 통합**: 로그/트레이스 수집기 설치 (선택)
3. **Chaos Mesh 통합**: 카오스 엔지니어링 도구 설치 (Phase 3)

## 참고

- 기존 Bedrock 시크릿(`aws-bedrock-secret`) 재사용
- 기존 MongoDB 설정(`alphacar-env` ConfigMap) 참조
- Prometheus는 외부 서버(192.168.0.175:9090) 사용

