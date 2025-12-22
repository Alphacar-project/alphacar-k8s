# 모니터링 분석 시스템 배포 가이드

## 빠른 시작

```bash
cd ~/alphacar/k8s
./deploy-monitoring-analysis.sh
```

## 수동 배포

### 1. 시크릿 및 ConfigMap

```bash
kubectl apply -f monitoring-analysis/secret.yaml
kubectl apply -f monitoring-analysis/configmap.yaml
kubectl apply -f monitoring-analysis/frontend/config.yaml
```

### 2. RBAC

```bash
kubectl apply -f monitoring-analysis/rbac.yaml
```

### 3. Backend

```bash
kubectl apply -f monitoring-analysis/backend/service.yaml
kubectl apply -f monitoring-analysis/backend/deployment.yaml
```

### 4. Frontend

```bash
kubectl apply -f monitoring-analysis/frontend/service.yaml
kubectl apply -f monitoring-analysis/frontend/deployment.yaml
```

### 5. Ingress

```bash
kubectl apply -f monitoring-analysis/ingress.yaml
```

### 6. CronJob (선택)

```bash
kubectl apply -f monitoring-analysis/cronjob.yaml
```

## 이미지 빌드 및 배포

현재 YAML 파일들은 임시 이미지(node:18-alpine, nginx:alpine)를 사용합니다.
실제 애플리케이션 이미지를 빌드한 후 교체해야 합니다.

### Backend 이미지 빌드 예시

```bash
# Dockerfile 예시
cd backend
docker build -t your-registry/monitoring-analysis-backend:1.0.0 .
docker push your-registry/monitoring-analysis-backend:1.0.0

# Deployment 업데이트
kubectl set image deployment/monitoring-analysis-backend \
  backend=your-registry/monitoring-analysis-backend:1.0.0 \
  -n alphacar
```

### Frontend 이미지 빌드 예시

```bash
# Dockerfile 예시
cd frontend
docker build -t your-registry/monitoring-analysis-frontend:1.0.0 .
docker push your-registry/monitoring-analysis-frontend:1.0.0

# Deployment 업데이트
kubectl set image deployment/monitoring-analysis-frontend \
  frontend=your-registry/monitoring-analysis-frontend:1.0.0 \
  -n alphacar
```

## 상태 확인

```bash
# Pod 상태
kubectl get pods -n alphacar | grep monitoring-analysis

# 로그 확인
kubectl logs -n alphacar -l app=monitoring-analysis-backend --tail=50
kubectl logs -n alphacar -l app=monitoring-analysis-frontend --tail=50

# 서비스 확인
kubectl get svc -n alphacar | grep monitoring-analysis

# Ingress 확인
kubectl get ingress -n alphacar | grep monitoring-analysis

# 헬스 체크
kubectl exec -n alphacar deployment/monitoring-analysis-backend -- curl http://localhost:5000/health
```

## 트러블슈팅

### Pod가 시작되지 않는 경우

1. **이미지 Pull 에러**
   ```bash
   kubectl describe pod -n alphacar -l app=monitoring-analysis-backend
   ```

2. **환경 변수 확인**
   ```bash
   kubectl get secret aws-bedrock-secret -n alphacar
   kubectl get configmap monitoring-analysis-config -n alphacar
   ```

3. **리소스 부족**
   ```bash
   kubectl top nodes
   kubectl top pods -n alphacar
   ```

### Backend가 Prometheus에 연결되지 않는 경우

1. **Prometheus 접근 확인**
   ```bash
   kubectl exec -n alphacar deployment/monitoring-analysis-backend -- \
     curl -v http://192.168.0.175:9090/api/v1/query?query=up
   ```

2. **네트워크 정책 확인**
   ```bash
   kubectl get networkpolicies -n alphacar
   ```

### Slack 알림이 작동하지 않는 경우

1. **웹훅 URL 확인**
   ```bash
   kubectl get secret monitoring-analysis-secret -n alphacar -o jsonpath='{.data.slack-webhook-url}' | base64 -d
   ```

2. **테스트**
   ```bash
   curl -X POST $(kubectl get secret monitoring-analysis-secret -n alphacar -o jsonpath='{.data.slack-webhook-url}' | base64 -d) \
     -H 'Content-Type: application/json' \
     -d '{"text":"테스트 메시지"}'
   ```

## 삭제

```bash
# 모든 리소스 삭제
kubectl delete -f monitoring-analysis/ingress.yaml
kubectl delete -f monitoring-analysis/frontend/deployment.yaml
kubectl delete -f monitoring-analysis/frontend/service.yaml
kubectl delete -f monitoring-analysis/backend/deployment.yaml
kubectl delete -f monitoring-analysis/backend/service.yaml
kubectl delete -f monitoring-analysis/cronjob.yaml
kubectl delete -f monitoring-analysis/rbac.yaml
kubectl delete -f monitoring-analysis/frontend/config.yaml
kubectl delete -f monitoring-analysis/configmap.yaml
# Secret은 보안상 수동 삭제 권장
# kubectl delete -f monitoring-analysis/secret.yaml
```

