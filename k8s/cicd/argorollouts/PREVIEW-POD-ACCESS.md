# Preview Pod 접속 가이드

## 🔍 문제 해결

### 문제
`version=preview` label로 Pod를 찾을 수 없었습니다.

### 원인
- Preview Pod의 label이 `version=stable`로 설정되어 있습니다
- Argo Rollouts는 `rollouts-pod-template-hash`를 사용하여 Pod를 식별합니다

---

## ✅ 올바른 방법

### 방법 1: rollouts-pod-template-hash 사용 (권장)

```bash
# Preview Pod IP 확인
kubectl get pod -n apc-fe-ns -l rollouts-pod-template-hash=668976b4cd \
  -o jsonpath='{.items[0].status.podIP}'
```

### 방법 2: Pod 이름으로 직접 접근

```bash
# Preview Pod 이름 확인
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns

# Pod IP 확인 (예: frontend-668976b4cd-88b9v)
kubectl get pod -n apc-fe-ns frontend-668976b4cd-88b9v \
  -o jsonpath='{.status.podIP}'
```

### 방법 3: Service를 통한 접속 (가장 간단)

```bash
# Port Forward
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000 --address=0.0.0.0
```

**브라우저**: http://192.168.0.170:8082

---

## 📊 현재 상태

### Preview Pod
- **이름**: `frontend-668976b4cd-88b9v`
- **Hash**: `668976b4cd`
- **Label**: `version=stable` (주의: preview인데 stable로 표시됨)
- **상태**: Running

### Service
- **이름**: `frontend-preview`
- **Selector**: `app=frontend, rollouts-pod-template-hash=668976b4cd`
- **포트**: 8000

---

## 🎯 빠른 접속 방법

### Step 1: Port Forward 실행
```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000 --address=0.0.0.0
```

### Step 2: 브라우저 접속
- http://192.168.0.170:8082
- 또는 http://localhost:8082

### Step 3: Preview 확인
- "Hello 크리스마스 🎄" **없음** 확인!

---

## 💡 핵심 포인트

1. **Label 주의**: `version=preview`가 아닌 `rollouts-pod-template-hash` 사용
2. **Service 사용**: 가장 간단한 방법은 Service를 통한 Port Forward
3. **Dashboard 확인**: Rollout 상태에서 Preview Pod 확인 가능

---

## 🔧 Dashboard 재시작

Dashboard가 종료되었다면:

```bash
kubectl-argo-rollouts dashboard --port 9003
```

또는 백그라운드로:
```bash
kubectl-argo-rollouts dashboard --port 9003 > /tmp/dashboard.log 2>&1 &
```

