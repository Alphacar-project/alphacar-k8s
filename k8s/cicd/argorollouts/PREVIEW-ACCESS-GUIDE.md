# Preview 접속 가이드

## ✅ Preview 생성 완료!

이전 버전 (`1.0.053-d53fade`)으로 Preview가 생성되었습니다.

---

## 📊 현재 상태

- **Stable/Active**: `1.0.054-christmas` (Hello 크리스마스 있음)
- **Preview**: `1.0.053-d53fade` (Hello 크리스마스 없음) ← 새로 생성됨!

---

## 🌐 Preview 접속 방법

### 방법 1: Port Forward (로컬 접속)

```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000 --address=0.0.0.0
```

**브라우저**: http://localhost:8082 또는 http://192.168.0.170:8082

### 방법 2: VM에서 직접 접속

```bash
# Pod IP 확인
kubectl get pod -n apc-fe-ns -l app=frontend,version=preview -o jsonpath='{.items[0].status.podIP}'

# 직접 접속 (Pod IP:8000)
```

---

## 🎬 영상 촬영 순서 (수정)

### Step 1: Preview 확인
```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000 --address=0.0.0.0
```

**브라우저**: http://192.168.0.170:8082
- "Hello 크리스마스 🎄" **없음** 확인!

### Step 2: Promote
**대시보드**: http://localhost:9003/rollouts/
- `frontend` Rollout 선택
- **"Promote" 버튼 클릭**

**또는 터미널**:
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

### Step 3: 프로덕션 확인
**브라우저**: https://alphacar.cloud 새로고침
- "Hello 크리스마스 🎄" **사라짐** 확인!

---

## 📋 전체 명령어

```bash
# 1. Preview 확인 (이미 실행됨)
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000 --address=0.0.0.0

# 2. 브라우저에서 확인
# http://192.168.0.170:8082

# 3. Promote
kubectl-argo-rollouts promote frontend -n apc-fe-ns

# 4. 프로덕션 확인
# https://alphacar.cloud
```

---

## ✅ 정리

1. ✅ **Preview 생성 완료** (`1.0.053-d53fade`)
2. ✅ **포트 포워딩 실행 중** (8082 포트)
3. ✅ **브라우저에서 확인 가능** (http://192.168.0.170:8082)
4. ⏳ **Promote 대기 중** (대시보드에서 버튼 클릭)

---

## 💡 핵심 포인트

- **`undo`는 Preview를 생성하지 않을 수 있습니다**
- **`set image`로 이전 버전 배포하면 Preview가 생성됩니다**
- **Preview 확인 후 Promote로 전환합니다**

