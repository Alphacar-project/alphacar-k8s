# 모니터링 분석 시스템 - 다음 단계

## ✅ 현재 상태

- **Kubernetes 리소스**: 모두 배포 완료
- **Backend**: 임시 서버 실행 중 (포트 5000)
- **Frontend**: 임시 페이지 표시 중 (NodePort 30099)
- **접속 URL**: http://192.168.56.200:30099

## 📋 다음 단계

### 1. Backend 애플리케이션 개발

#### 필요한 기능
- Prometheus API 연동
- Bedrock API 통합 (분석 요청)
- Slack 웹훅 알림
- WebSocket 실시간 스트리밍
- k6 부하테스트 Job 생성
- 리포트 생성 (PDF/Excel)

#### 기술 스택 제안
- **언어**: Node.js/Express 또는 Python/FastAPI
- **라이브러리**:
  - `@aws-sdk/client-bedrock-runtime` - Bedrock 통합
  - `axios` - Prometheus API 호출
  - `@slack/webhook` - Slack 알림
  - `ws` - WebSocket
  - `@kubernetes/client-node` - k8s Job 생성
  - `pdfkit` 또는 `exceljs` - 리포트 생성

#### API 엔드포인트 구조
```
POST /api/analyze/metrics    - 메트릭 분석
POST /api/analyze/logs       - 로그 분석
POST /api/analyze/traces     - 트레이스 분석
GET  /api/metrics/graph      - 메트릭 그래프 데이터
POST /api/loadtest/start     - k6 부하테스트 시작
GET  /api/loadtest/status/:id - 테스트 상태
POST /api/reports/generate   - 리포트 생성
GET  /api/reports/:id        - 리포트 다운로드
WS   /ws                     - WebSocket 스트리밍
GET  /health                 - 헬스 체크
```

### 2. Frontend 애플리케이션 개발

#### 필요한 기능
- 메트릭/로그/트레이스 분석 결과 표시
- 그래프 시각화 (Chart.js/Recharts)
- 실시간 업데이트 (WebSocket)
- 부하테스트 제어판
- 리포트 다운로드

#### 기술 스택 제안
- **프레임워크**: React + TypeScript
- **상태 관리**: Redux 또는 Zustand
- **차트**: Recharts 또는 Chart.js
- **UI 라이브러리**: Material-UI 또는 Ant Design
- **WebSocket**: `socket.io-client` 또는 `ws`

#### 주요 컴포넌트
```
Dashboard/
  ├─ MetricsAnalysis/     - 메트릭 분석 탭
  ├─ LogsAnalysis/       - 로그 분석 탭
  ├─ TracesAnalysis/     - 트레이스 분석 탭
  ├─ LoadTestControl/    - 부하테스트 제어판
  ├─ ComparisonView/      - 비교 분석 뷰
  └─ Reports/            - 리포트 관리
```

### 3. Docker 이미지 빌드

#### Backend 이미지 빌드
```bash
# Dockerfile 예시
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

```bash
# 빌드 및 푸시
docker build -t 192.168.0.169/bh/monitoring-analysis-backend:1.0.0 .
docker push 192.168.0.169/bh/monitoring-analysis-backend:1.0.0
```

#### Frontend 이미지 빌드
```bash
# Dockerfile 예시 (Multi-stage)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# 빌드 및 푸시
docker build -t 192.168.0.169/bh/monitoring-analysis-frontend:1.0.0 .
docker push 192.168.0.169/bh/monitoring-analysis-frontend:1.0.0
```

### 4. 이미지 교체 및 배포

#### Backend 이미지 교체
```bash
kubectl set image deployment/monitoring-analysis-backend \
  backend=192.168.0.169/bh/monitoring-analysis-backend:1.0.0 \
  -n alphacar
```

#### Frontend 이미지 교체
```bash
kubectl set image deployment/monitoring-analysis-frontend \
  frontend=192.168.0.169/bh/monitoring-analysis-frontend:1.0.0 \
  -n alphacar
```

### 5. 테스트 및 검증

#### 기능 테스트
```bash
# Backend 헬스 체크
curl http://192.168.56.200:30099/api/health

# 메트릭 분석 테스트
curl -X POST http://192.168.56.200:30099/api/analyze/metrics \
  -H "Content-Type: application/json" \
  -d '{"query": "up", "startTime": "2025-12-18T00:00:00Z", "endTime": "2025-12-18T23:59:59Z"}'

# 부하테스트 시작
curl -X POST http://192.168.56.200:30099/api/loadtest/start \
  -H "Content-Type: application/json" \
  -d '{"scenario": "loadtest.js", "duration": "5m", "vus": 20}'
```

## 📝 개발 가이드

### Backend 개발 시작

1. **프로젝트 초기화**
```bash
mkdir monitoring-analysis-backend
cd monitoring-analysis-backend
npm init -y
npm install express cors dotenv
npm install @aws-sdk/client-bedrock-runtime
npm install @slack/webhook
npm install ws
npm install @kubernetes/client-node
npm install axios
```

2. **기본 서버 구조**
```javascript
// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'monitoring-analysis-backend' });
});

// API routes
app.post('/api/analyze/metrics', require('./routes/analyzeMetrics'));
app.post('/api/analyze/logs', require('./routes/analyzeLogs'));
app.post('/api/analyze/traces', require('./routes/analyzeTraces'));
app.get('/api/metrics/graph', require('./routes/metricsGraph'));
app.post('/api/loadtest/start', require('./routes/loadtestStart'));
app.post('/api/reports/generate', require('./routes/generateReport'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Frontend 개발 시작

1. **프로젝트 초기화**
```bash
npx create-react-app monitoring-analysis-frontend --template typescript
cd monitoring-analysis-frontend
npm install @reduxjs/toolkit react-redux
npm install recharts
npm install @mui/material @emotion/react @emotion/styled
npm install axios
npm install socket.io-client
```

2. **환경 변수 설정**
```bash
# .env
REACT_APP_API_URL=http://192.168.56.200:30099/api
REACT_APP_WS_URL=ws://192.168.56.200:30099/ws
```

## 🔧 현재 설정 확인

### 환경 변수
```bash
# Backend 환경 변수 확인
kubectl get deployment monitoring-analysis-backend -n alphacar -o jsonpath='{.spec.template.spec.containers[0].env[*]}' | jq

# Frontend 환경 변수 확인
kubectl get deployment monitoring-analysis-frontend -n alphacar -o jsonpath='{.spec.template.spec.containers[0].env[*]}' | jq
```

### 로그 확인
```bash
# Backend 로그
kubectl logs -n alphacar -l app=monitoring-analysis-backend --tail=50

# Frontend 로그
kubectl logs -n alphacar -l app=monitoring-analysis-frontend --tail=50
```

## 📚 참고 자료

- [AWS Bedrock SDK](https://docs.aws.amazon.com/bedrock/latest/userguide/service_code.html)
- [Prometheus Query API](https://prometheus.io/docs/prometheus/latest/querying/api/)
- [Kubernetes JavaScript Client](https://github.com/kubernetes-client/javascript)
- [Recharts Documentation](https://recharts.org/)

## ⚠️ 주의사항

1. **이미지 레지스트리**: Harbor 레지스트리(192.168.0.169) 사용
2. **시크릿**: 기존 `aws-bedrock-secret` 재사용
3. **네임스페이스**: `alphacar` 네임스페이스 사용
4. **ServiceAccount**: `monitoring-analysis-sa` 사용 (k6 Job 생성 권한)

## 🚀 빠른 시작

임시 페이지가 정상 작동하므로, 이제 실제 애플리케이션 개발을 시작할 수 있습니다!

1. Backend 코드 작성
2. Frontend 코드 작성
3. Docker 이미지 빌드
4. 이미지 교체 및 배포
5. 테스트 및 검증

