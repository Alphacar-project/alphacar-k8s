# 롤백 시 Preview 생성 문제 해결

## 🔍 문제 상황

`kubectl-argo-rollouts undo frontend -n apc-fe-ns` 실행 후 Preview가 생성되지 않음

---

## ❌ 원인

Blue-Green 배포에서 `undo` 명령어는:
- 이전 버전으로 롤백을 **시작**하지만
- **Preview를 자동으로 생성하지 않을 수 있습니다**
- 이미 이전 버전이 ScaledDown 상태이면 Preview 생성이 안 될 수 있습니다

---

## ✅ 해결 방법

### 방법 1: 이전 버전 이미지로 새로 배포 (권장)

이전 버전의 이미지로 새로 배포하면 Preview가 생성됩니다:

```bash
# 현재 버전 확인
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns

# 이전 버전 이미지로 배포 (예: 1.0.053-d53fade)
kubectl-argo-rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.053-d53fade \
  -n apc-fe-ns
```

이렇게 하면:
- ✅ Preview 버전이 생성됩니다
- ✅ Preview에서 확인 가능
- ✅ Promote로 전환 가능

---

### 방법 2: 롤백 후 강제로 새 버전 배포

```bash
# 1. 롤백 실행
kubectl-argo-rollouts undo frontend -n apc-fe-ns

# 2. 현재 이미지 확인
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns

# 3. 다른 버전으로 배포하여 Preview 생성
kubectl-argo-rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.053-d53fade \
  -n apc-fe-ns
```

---

### 방법 3: 직접 Promote (Preview 없이)

Preview 없이 바로 이전 버전으로 전환:

```bash
# 1. 롤백 실행
kubectl-argo-rollouts undo frontend -n apc-fe-ns

# 2. 바로 Promote (Preview 확인 없이)
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

---

## 🎬 영상 촬영 시나리오 (수정)

### 시나리오: 크리스마스 버전 → 원래 버전 롤백

#### Step 1: 현재 상태 확인
```bash
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns
```
- 현재: `1.0.054-christmas` (Hello 크리스마스 있음)

#### Step 2: 이전 버전으로 배포 (Preview 생성)
```bash
kubectl-argo-rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.053-d53fade \
  -n apc-fe-ns
```

**대시보드에서 확인**:
- Preview 버전 생성 중
- 새 Pod 생성 확인

**대기**: 10-15초 (Pod 생성 대기)

#### Step 3: Preview 확인
```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000 --address=0.0.0.0
```

**브라우저**: http://192.168.0.170:8082
- "Hello 크리스마스 🎄" **없음** 확인!

#### Step 4: Promote
**대시보드**: "Promote" 버튼 클릭

**또는 터미널**:
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**브라우저**: https://alphacar.cloud 새로고침
- "Hello 크리스마스 🎄" **사라짐** 확인!

---

## 📋 전체 명령어 (수정된 버전)

```bash
# 1. 현재 상태 확인
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns

# 2. 이전 버전으로 배포 (Preview 생성)
kubectl-argo-rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.053-d53fade \
  -n apc-fe-ns

# 3. Preview 확인 (새 터미널)
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000 --address=0.0.0.0

# 4. Promote
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

---

## 💡 핵심 포인트

1. **`undo`는 Preview를 생성하지 않을 수 있습니다**
2. **`set image`로 새 버전 배포하면 Preview가 생성됩니다**
3. **Preview 확인 후 Promote로 전환합니다**

---

## ✅ 권장 방법

영상 촬영 시:
- `undo` 대신 `set image`로 이전 버전 배포
- Preview 생성 확인
- Preview에서 테스트
- Promote로 전환

이렇게 하면 Blue-Green 배포의 전체 과정을 시연할 수 있습니다!

