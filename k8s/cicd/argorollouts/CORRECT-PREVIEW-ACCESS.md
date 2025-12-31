# Preview Pod 접속 - 올바른 방법

## ❌ 잘못된 방법

```bash
# 이렇게 하면 안 됩니다!
kubectl get pod -n apc-fe-ns -l app=frontend,version=preview
```

**이유**: Preview Pod는 `version=preview` label이 없습니다!

---

## ✅ 올바른 방법

### 방법 1: rollouts-pod-template-hash 사용 (권장)

```bash
# Preview Pod IP 확인
kubectl get pod -n apc-fe-ns -l rollouts-pod-template-hash=668976b4cd \
  -o jsonpath='{.items[0].status.podIP}'
```

**결과**: `10.244.82.92`

### 방법 2: Rollout에서 Preview Hash 확인 후 사용

```bash
# 1. Preview Hash 확인
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns

# 출력에서 preview로 표시된 ReplicaSet의 Hash 확인
# 예: frontend-668976b4cd (Hash: 668976b4cd)

# 2. 해당 Hash로 Pod 찾기
kubectl get pod -n apc-fe-ns -l rollouts-pod-template-hash=668976b4cd
```

### 방법 3: Service를 통한 접속 (가장 간단) ⭐

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
- **IP**: `10.244.82.92`
- **Label**: `app=frontend, rollouts-pod-template-hash=668976b4cd, version=stable`

**주의**: `version=stable`이지만 실제로는 Preview Pod입니다!

### Stable Pod
- **이름**: `frontend-97c78497c-jv9x4`
- **Hash**: `97c78497c`
- **Label**: `app=frontend, rollouts-pod-template-hash=97c78497c, version=stable`

---

## 🎯 빠른 참조 명령어

### Preview Pod IP 확인
```bash
kubectl get pod -n apc-fe-ns -l rollouts-pod-template-hash=668976b4cd \
  -o jsonpath='{.items[0].status.podIP}'
```

### Preview Pod 이름 확인
```bash
kubectl get pod -n apc-fe-ns -l rollouts-pod-template-hash=668976b4cd \
  -o jsonpath='{.items[0].metadata.name}'
```

### Preview 접속 (Service 사용)
```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000 --address=0.0.0.0
```

---

## 💡 핵심 포인트

1. **`version=preview` label은 없습니다**
2. **`rollouts-pod-template-hash`로 Preview Pod를 식별합니다**
3. **Service를 통한 접속이 가장 간단합니다**

---

## 🔍 Rollout에서 Hash 확인

```bash
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns
```

출력 예시:
```
├──# revision:5
│  └──⧉ frontend-668976b4cd  ReplicaSet  ✔ Healthy  preview  ← 이 Hash 사용
└──# revision:4
   └──⧉ frontend-97c78497c  ReplicaSet  ✔ Healthy  stable,active
```

- Preview: `668976b4cd`
- Stable: `97c78497c`

---

## ✅ 정리

### 올바른 명령어
```bash
# Preview Pod IP
kubectl get pod -n apc-fe-ns -l rollouts-pod-template-hash=668976b4cd \
  -o jsonpath='{.items[0].status.podIP}'

# 또는 Service 사용 (권장)
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000 --address=0.0.0.0
```

### 잘못된 명령어
```bash
# ❌ 이렇게 하지 마세요!
kubectl get pod -n apc-fe-ns -l app=frontend,version=preview
```

