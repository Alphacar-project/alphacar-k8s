# Port Forward 오류 해결

## 🔍 문제 상황

포트 포워딩 시 "connection refused" 오류 발생

---

## ✅ 해결 방법

### 방법 1: Service를 통한 Port Forward (권장)

```bash
# 기존 프로세스 종료
pkill -f "port-forward.*frontend-preview"

# Port Forward 재시작
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000 --address=0.0.0.0
```

**브라우저**: http://192.168.0.170:8082

---

### 방법 2: Pod 직접 접속 (Istio 사용 시 주의)

Istio sidecar가 있으면 Pod 직접 접속이 복잡할 수 있습니다.

```bash
# Pod IP 확인
kubectl get pod -n apc-fe-ns -l rollouts-pod-template-hash=668976b4cd \
  -o jsonpath='{.items[0].status.podIP}'

# Pod 직접 Port Forward (시도)
kubectl port-forward -n apc-fe-ns frontend-668976b4cd-88b9v 8082:8000 --address=0.0.0.0
```

---

### 방법 3: Service ClusterIP 사용

```bash
# Service ClusterIP 확인
kubectl get svc -n apc-fe-ns frontend-preview -o jsonpath='{.spec.clusterIP}'

# ClusterIP로 Port Forward
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000 --address=0.0.0.0
```

---

## 🔧 문제 원인

1. **Istio Sidecar**: Pod에 Istio sidecar가 있어 네트워크 경로가 복잡할 수 있음
2. **네트워크 네임스페이스**: Pod 내부 네트워크 네임스페이스 접근 문제
3. **포트 바인딩**: Pod가 특정 IP에만 바인딩되어 있을 수 있음

---

## ✅ 확인 사항

### Pod 상태 확인
```bash
kubectl get pod -n apc-fe-ns frontend-668976b4cd-88b9v
```

### Pod 포트 확인
```bash
kubectl exec -n apc-fe-ns frontend-668976b4cd-88b9v -c frontend -- netstat -tlnp
```

### Service 확인
```bash
kubectl get svc -n apc-fe-ns frontend-preview
kubectl get endpoints -n apc-fe-ns frontend-preview
```

---

## 🎯 권장 해결책

### Step 1: 기존 프로세스 정리
```bash
pkill -f "port-forward.*frontend-preview"
```

### Step 2: Service를 통한 Port Forward
```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000 --address=0.0.0.0
```

### Step 3: 접속 확인
```bash
curl http://localhost:8082
# 또는 브라우저: http://192.168.0.170:8082
```

---

## 💡 대안 방법

### Istio Gateway 사용 (이미 설정되어 있다면)

```bash
# VirtualService 확인
kubectl get vs -n apc-fe-ns | grep frontend

# Gateway를 통한 접속 (도메인 사용)
# 예: https://alphacar.cloud (VirtualService 설정 필요)
```

---

## 📋 체크리스트

- [ ] 기존 port-forward 프로세스 종료
- [ ] Service 상태 확인
- [ ] Pod 상태 확인
- [ ] Port Forward 재시도
- [ ] 브라우저 접속 확인

