# Frontend Rollout 배포 완료! 🎉

## ✅ 배포 완료

**Frontend Rollout이 성공적으로 배포되었습니다!**

---

## 📊 대시보드에서 확인하기

### 방법 1: 네임스페이스 변경

**대시보드에서:**
1. 상단의 **"NAMESPACE"** 필드 클릭
2. **`apc-fe-ns`** 선택
3. **`frontend`** Rollout 확인!

### 방법 2: 모든 네임스페이스 보기

**대시보드에서:**
1. **"NAMESPACE"** 필드를 비우거나
2. **`(All namespaces)`** 선택
3. 두 개의 Rollout 확인:
   - `news-backend` (apc-be-ns)
   - `frontend` (apc-fe-ns)

---

## 🎬 이제 Blue-Green 배포 시연 시작!

### Step 1: 현재 상태 확인

**대시보드에서:**
- `frontend` Rollout 클릭
- 현재 상태 확인 (Stable 버전 실행 중)

**브라우저에서:**
- https://alphacar.cloud 접근
- "고객님, 어떤 차를 찾으시나요?" 확인 (Hello 크리스마스 없음)

---

### Step 2: 새 버전 배포

**터미널에서:**
```bash
kubectl argo rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas \
  -n apc-fe-ns
```

**대시보드에서:**
- Preview 버전이 생성되는 과정 확인
- Blue (Stable)와 Green (Preview) 두 버전 동시 실행 확인

---

### Step 3: Preview 테스트

```bash
# Preview 서비스로 직접 접근
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8001:8000
```

**브라우저에서:**
- http://localhost:8001 접근
- "Hello 크리스마스 🎄" 확인!

---

### Step 4: Promote (프로덕션 전환)

**대시보드에서:**
- `frontend` Rollout의 **"Promote"** 버튼 클릭
- 또는 터미널에서:
  ```bash
  kubectl argo rollouts promote frontend -n apc-fe-ns
  ```

**브라우저에서:**
- https://alphacar.cloud 접근
- "Hello 크리스마스 🎄" 확인!

---

### Step 5: 롤백

**대시보드에서:**
- `frontend` Rollout의 **"Abort"** 또는 **"Retry"** 버튼 클릭
- 또는 터미널에서:
  ```bash
  kubectl argo rollouts undo frontend -n apc-fe-ns
  ```

**브라우저에서:**
- https://alphacar.cloud 접근
- "Hello 크리스마스 🎄" 사라진 것 확인!

---

## 📋 현재 Rollout 목록

1. **news-backend** (apc-be-ns)
   - 전략: Canary
   - 상태: Degraded (문제 있음)

2. **frontend** (apc-fe-ns) ✨ 새로 배포됨!
   - 전략: Blue-Green
   - 상태: 배포 중

---

## 💡 팁

### 대시보드 새로고침

대시보드가 업데이트되지 않으면:
- 브라우저 새로고침 (F5)
- 또는 자동 새로고침 대기 (몇 초)

### 네임스페이스 필터

- **`apc-fe-ns`**: frontend만 보기
- **`apc-be-ns`**: news-backend만 보기
- **`(All namespaces)`**: 모든 Rollout 보기

---

## ✅ 준비 완료!

이제 대시보드에서 `frontend` Rollout을 확인하고 Blue-Green 배포 시연을 시작할 수 있습니다!

