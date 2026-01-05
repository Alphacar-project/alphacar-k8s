# AIOps 통합 뷰 가이드

## 개요

AIOps (Artificial Intelligence for IT Operations) 기능은 온프레미스와 다수의 클라우드 인프라의 로그, 메트릭, 이벤트 등을 실시간으로 통합 수집·분석하여 전체 환경을 한눈에 파악합니다. 또한, 실시간 이상 탐지 및 근본 원인을 빠르게 자동 파악하고, 상황에 맞게 사전 정의된 대응 시나리오를 자동으로 실행합니다.

## 주요 기능

### 1. 멀티 클라우드 데이터 수집
- **Kubernetes**: Prometheus를 통한 메트릭 수집
- **AWS**: CloudWatch 메트릭 및 로그 수집 (구현 준비됨)
- **Azure**: Azure Monitor 메트릭 및 로그 수집 (구현 준비됨)
- **GCP**: GCP Monitoring 메트릭 및 로그 수집 (구현 준비됨)
- **OnPrem**: 온프레미스 엔드포인트에서 데이터 수집 (구현 준비됨)

### 2. 실시간 이상 탐지
- **통계적 이상 탐지**: 3-sigma 규칙을 사용한 이상치 탐지
- **ML 기반 이상 탐지**: AWS Bedrock을 활용한 머신러닝 기반 탐지
- **패턴 기반 이상 탐지**: 로그 및 이벤트 패턴 분석

### 3. 근본 원인 분석 (RCA)
- AWS Bedrock을 사용한 자동 근본 원인 분석
- 관련 메트릭, 로그, 이벤트를 종합 분석
- 신뢰도 점수 제공

### 4. 자동 대응 시나리오
다음과 같은 시나리오가 사전 정의되어 있습니다:

#### Pod CrashLoopBackOff 자동 재시작
- **트리거**: Pod가 CrashLoopBackOff 상태일 때
- **동작**: 
  1. Pod 로그 확인
  2. Pod 재시작
  3. Deployment 상태 확인
- **승인 필요**: 없음

#### 고 CPU 사용률 자동 스케일업
- **트리거**: CPU 사용률이 85% 이상일 때
- **동작**: Pod 수를 1.5배로 증가
- **승인 필요**: 없음

#### OOM 발생 시 메모리 제한 증가
- **트리거**: OOM 킬이 발생했을 때
- **동작**: 메모리 제한을 2Gi로 증가
- **승인 필요**: 예

#### 노드 장애 시 Pod 이동
- **트리거**: 노드가 NotReady 상태일 때
- **동작**: 
  1. 노드 Cordon
  2. 노드 Drain
- **승인 필요**: 예

#### Pending Pod 해결을 위한 스케일업
- **트리거**: Pod가 Pending 상태일 때
- **동작**: Deployment 스케일업 (1.2배)
- **승인 필요**: 없음

## 사용 방법

### 대시보드 접근

1. GenAI 모니터링 대시보드에 접속
2. 사이드바에서 "🤖 AIOps 통합 뷰" 클릭
3. 또는 스크롤하여 "🤖 AIOps 통합 뷰" 섹션으로 이동

### 이상 탐지 실행

1. "🔍 이상 탐지 실행" 버튼 클릭
2. 시스템이 모든 소스에서 데이터를 수집하고 분석
3. 결과가 실시간으로 표시됨:
   - **Critical**: 심각한 이상 징후
   - **Warning**: 경고 수준 이상 징후
   - **Info**: 정보성 이상 징후

### 이상 징후 상세 정보

각 이상 징후 카드에는 다음 정보가 표시됩니다:
- **타입**: 이상 징후 유형
- **메트릭**: 관련 메트릭 이름
- **위치**: 문제가 발생한 위치 (네임스페이스/Pod 등)
- **근본 원인**: AI가 분석한 주요 원인
- **신뢰도**: 분석 신뢰도 (0-100%)
- **권장 시나리오**: 자동 실행 가능한 대응 시나리오

### 시나리오 실행

1. 이상 징후 카드에서 권장 시나리오 확인
2. "실행" 버튼 클릭
3. 확인 대화상자에서 승인
4. 시나리오가 자동으로 실행됨
5. 실행 이력에서 결과 확인

### 실행 이력 확인

- "실행 이력" 섹션에서 모든 시나리오 실행 기록 확인
- 각 실행의 상태 (완료/실행 중/실패) 확인
- 단계별 상세 정보 확인

## API 엔드포인트

### 이상 탐지
```bash
POST /api/aiops/anomalies/detect
Content-Type: application/json

{
  "timeRange": "5m"
}
```

### 시나리오 실행
```bash
POST /api/aiops/remediation/execute
Content-Type: application/json

{
  "anomalyId": "anomaly_123",
  "scenarioId": "pod-crashloop-restart",
  "autoApprove": false,
  "anomaly": { ... }
}
```

### 시나리오 목록 조회
```bash
GET /api/aiops/scenarios
```

### 실행 이력 조회
```bash
GET /api/aiops/executions?limit=50
```

### 특정 실행 상세 조회
```bash
GET /api/aiops/executions/{executionId}
```

## 설정

### 환경 변수

백엔드 서버의 환경 변수 설정:

```bash
# Prometheus URL
PROMETHEUS_URL=http://prometheus.apc-obsv-ns.svc.cluster.local:9090

# AWS Bedrock 설정 (AI 분석용)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
BEDROCK_LLM_MODEL_ID=us.meta.llama3-3-70b-instruct-v1:0

# Slack 알림 (선택사항)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CHANNEL_ID=C1234567890
```

### Kubernetes 권한

자동 대응 시나리오를 실행하려면 다음 Kubernetes 권한이 필요합니다:

- `deployments`: get, list, patch, update
- `pods`: get, list, delete
- `nodes`: get, list, patch
- `scales`: get, update

ServiceAccount에 적절한 RBAC 권한을 부여해야 합니다.

## 아키텍처

```
┌─────────────────┐
│  Frontend       │
│  (Dashboard)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │
│  (server.js)    │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    ▼         ▼              ▼              ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│MultiCloud│ │Anomaly   │ │Remediation│ │AWS       │
│Collector │ │Detector  │ │Engine     │ │Bedrock   │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │            │
     ▼            ▼            ▼            ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Prometheus│ │Statistical│ │Kubernetes│ │AI Analysis│
│Loki     │ │ML         │ │API       │ │           │
│Tempo    │ │Pattern    │ │          │ │           │
└─────────┘ └──────────┘ └──────────┘ └──────────┘
```

## 확장 가능성

### 새로운 수집기 추가

`aiops/multiCloudCollector.js`에 새로운 수집기 클래스를 추가:

```javascript
class NewCloudCollector {
  async collect() {
    // 데이터 수집 로직
    return { metrics: [], logs: [], events: [] };
  }
}
```

### 새로운 시나리오 추가

`aiops/remediationEngine.js`의 `loadScenarios()` 메서드에 새 시나리오 추가:

```javascript
{
  id: 'new-scenario',
  name: '새 시나리오',
  description: '시나리오 설명',
  trigger: { type: 'anomaly', metric: 'metric-name' },
  requiresApproval: false,
  steps: [
    {
      id: 'step-1',
      action: 'restart-service',
      params: { namespace: '${anomaly.namespace}', deployment: '${anomaly.deployment}' }
    }
  ]
}
```

## 문제 해결

### 이상 탐지가 작동하지 않음
- Prometheus 연결 확인
- AWS Bedrock 자격 증명 확인
- 백엔드 로그 확인

### 시나리오 실행 실패
- Kubernetes 권한 확인
- kubectl 명령어가 서버에서 실행 가능한지 확인
- 실행 이력에서 오류 메시지 확인

### AI 분석이 작동하지 않음
- AWS Bedrock 자격 증명 확인
- 모델 ID 확인
- 네트워크 연결 확인

## 참고 자료

- [Prometheus Query API](https://prometheus.io/docs/prometheus/latest/querying/api/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Kubernetes API](https://kubernetes.io/docs/reference/kubernetes-api/)
