# Alertmanager 설정 가이드

## Lambda 함수 URL

Lambda 함수가 성공적으로 배포되었습니다:

**Lambda 함수 URL**: `https://palsyd7zml43doi3otjtl3acoa0sghie.lambda-url.ap-northeast-2.on.aws/`

## Alertmanager 설정

### 1. Alertmanager ConfigMap 수정

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: apc-obsv-ns
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
    
    route:
      receiver: 'webhook'
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
    
    receivers:
      - name: 'webhook'
        webhook_configs:
          - url: 'https://palsyd7zml43doi3otjtl3acoa0sghie.lambda-url.ap-northeast-2.on.aws/'
            http_config:
              follow_redirects: true
            send_resolved: false  # resolved 알림은 보내지 않음
```

### 2. ConfigMap 적용

```bash
kubectl apply -f alertmanager-configmap.yaml -n apc-obsv-ns
kubectl rollout restart deployment/alertmanager -n apc-obsv-ns
```

### 3. 테스트

Alertmanager에서 테스트 알림 전송:

```bash
# 테스트 알림 생성
kubectl run test-alert --image=busybox --rm -it --restart=Never -- \
  sh -c "curl -X POST http://alertmanager:9093/api/v1/alerts -H 'Content-Type: application/json' -d '[{\"labels\":{\"alertname\":\"TestAlert\",\"namespace\":\"default\"},\"annotations\":{\"summary\":\"Test alert\"},\"status\":\"firing\"}]'"
```

## 워크플로우 프로세스

1. **Alertmanager → Lambda**: 알림 발생 시 Lambda 함수 호출
2. **Lambda → Backend API**: 백엔드 API를 통해 워크플로우 시작
3. **AI 분석**: AI가 해결책 제시
4. **엔지니어 승인**: 대시보드에서 승인/거부
5. **실행**: 승인 시 시나리오 실행
6. **재분석**: 결과 확인 후 AI가 다시 분석
7. **반복**: 해결될 때까지 반복

## 대시보드 사용

1. **AIOps 통합 뷰** 섹션으로 이동
2. **Event-Driven Automation 워크플로우** 카드 확인
3. 승인이 필요한 워크플로우는 **✅ 승인** 또는 **❌ 거부** 버튼 클릭
4. 실행 후 자동으로 재분석되어 새로운 해결책이 제시될 수 있음
