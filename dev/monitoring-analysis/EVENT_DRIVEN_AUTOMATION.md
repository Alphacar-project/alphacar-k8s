# Event-Driven Automation 가이드

## 개요

Prometheus Alertmanager + AWS Lambda를 통한 Event-Driven Automation 시스템입니다.

### 주요 특징

1. **엔지니어 승인 필수**: AI가 제안한 해결책은 엔지니어의 승인(예/아니오)이 필요합니다.
2. **반복적인 문제 해결**: 한 번에 해결되지 않으면 자동으로 재분석하여 새로운 해결책을 제시합니다.
3. **결과 확인 및 재분석**: 실행 후 결과를 확인하고, AI가 다시 분석하여 해결 여부를 판단합니다.

## 워크플로우

```
1. Prometheus Alertmanager → 알림 발생
2. Lambda/API → 워크플로우 시작
3. AI 분석 → 해결책 제시
4. 엔지니어 승인 (예/아니오)
   - 아니오 → 워크플로우 종료
   - 예 → 5번으로
5. 시나리오 실행
6. 결과 확인 (10초 대기 후 메트릭/상태 재확인)
7. AI 재분석
   - 해결됨 → 워크플로우 완료
   - 미해결 → 3번으로 돌아가서 새로운 해결책 제시
```

## API 엔드포인트

### 1. Alertmanager Webhook 수신
```
POST /api/aiops/workflows
Content-Type: application/json

{
  "alerts": [
    {
      "labels": {
        "alertname": "HighCPU",
        "namespace": "default",
        "pod": "my-pod"
      },
      "annotations": {
        "summary": "CPU usage is high"
      },
      "status": "firing",
      "startsAt": "2026-01-05T12:00:00Z",
      "fingerprint": "abc123"
    }
  ]
}
```

### 2. 해결책 승인/거부
```
POST /api/aiops/workflows/approve
Content-Type: application/json

{
  "workflowId": "workflow_1234567890_abc",
  "approved": true  // 또는 false
}
```

### 3. 활성 워크플로우 목록
```
GET /api/aiops/workflows
```

### 4. 특정 워크플로우 조회
```
GET /api/aiops/workflows/{workflowId}
```

## Lambda 함수 설정

### 1. Lambda 함수 생성

```bash
# Lambda 함수 패키징
cd dev/monitoring-analysis/backend/aiops/lambda
zip -r alertmanager-handler.zip . -x "*.git*" "*.md"

# Lambda 함수 생성 (AWS CLI)
aws lambda create-function \
  --function-name alertmanager-webhook-handler \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler alertmanagerHandler.handler \
  --zip-file fileb://alertmanager-handler.zip \
  --timeout 300 \
  --memory-size 512
```

### 2. API Gateway 설정

Lambda 함수를 API Gateway와 연결하여 Alertmanager webhook을 받을 수 있도록 설정합니다.

### 3. Alertmanager 설정

`alertmanager.yml`에 webhook 설정:

```yaml
route:
  receiver: 'webhook'
  
receivers:
  - name: 'webhook'
    webhook_configs:
      - url: 'https://YOUR_API_GATEWAY_URL/api/aiops/workflows'
        http_config:
          bearer_token: 'YOUR_TOKEN'
```

## 프론트엔드 사용

1. **AIOps 통합 뷰** 섹션에서 "Event-Driven Automation 워크플로우" 카드 확인
2. 활성 워크플로우 목록이 표시됩니다
3. 승인이 필요한 워크플로우는 **✅ 승인** 또는 **❌ 거부** 버튼 클릭
4. 승인 후 자동으로 실행되고 결과를 확인합니다
5. 해결되지 않으면 새로운 해결책이 자동으로 제시됩니다

## 워크플로우 상태

- `analyzing`: AI가 분석 중
- `pending_approval`: 엔지니어 승인 대기
- `executing`: 시나리오 실행 중
- `resolved`: 문제 해결됨
- `failed`: 실행 실패
- `rejected`: 해결책 거부됨

## 주의사항

1. **승인 필수**: 모든 해결책은 엔지니어의 승인이 필요합니다.
2. **반복 제한**: 무한 반복을 방지하기 위해 최대 시도 횟수 제한을 고려하세요.
3. **모니터링**: 워크플로우 상태를 지속적으로 모니터링하세요.
