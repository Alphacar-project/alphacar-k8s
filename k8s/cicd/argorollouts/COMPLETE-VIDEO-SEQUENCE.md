# 🎬 완전한 영상 촬영 순서 (처음부터)

## ✅ 초기 상태 설정 완료

- ✅ 모든 Pod 정리
- ✅ Rollout 재생성
- ✅ **초기 프로덕션: 크리스마스 버전** (Hello 크리스마스 있음)
- ✅ frontend-preview: NodePort (30844) 설정 완료

---

## 📊 현재 상태

- **프로덕션**: `1.0.054-christmas` (크리스마스 버전)
- **접속**: https://alphacar.cloud
- **내용**: "Hello 크리스마스 🎄" **있음**

---

## 🎥 영상 촬영 순서

### Step 1: 대시보드 접속
브라우저: `http://localhost:9003/rollouts/`

**확인**: `frontend` Rollout 보임

---

### Step 2: 초기 상태 확인
**브라우저 (프로덕션)**:
- https://alphacar.cloud 접속
- "Hello 크리스마스 🎄" **있음** 확인

**설명**: "현재 프로덕션에는 Hello 크리스마스가 있습니다"

---

### Step 3: Green 배포 (크리스마스 제거)

**터미널 명령어**:
```bash
kubectl-argo-rollouts set image frontend frontend=192.168.0.170:30000/alphacar/frontend:1.0.053-d53fade -n apc-fe-ns
```

**대시보드에서 확인** (5-10초 대기):
- Preview 버전 생성 중
- Green 버전 (크리스마스 없음) 배포

**설명**: "Green 버전을 배포합니다. 크리스마스가 없는 버전입니다"

---

### Step 4: Preview 확인 (Green)

**브라우저 (Preview)**:
- http://192.168.0.170:30844 접속
- "Hello 크리스마스 🎄" **없음** 확인!

**브라우저 (프로덕션)**:
- https://alphacar.cloud 접속
- "Hello 크리스마스 🎄" **여전히 있음** (아직 프로덕션)

**설명**: "Preview에서 Green 버전을 확인합니다. 크리스마스가 없습니다"

---

### Step 5: Promote (Green으로 전환)

**대시보드에서**:
1. `frontend` Rollout 선택
2. **"Promote" 버튼 클릭**

**또는 터미널**:
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**대시보드에서 확인** (3-5초 대기):
- Preview → Stable/Active로 변경
- 크리스마스 버전 → ScaledDown

**브라우저 (프로덕션)**:
- https://alphacar.cloud **새로고침** (Ctrl+Shift+R)
- "Hello 크리스마스 🎄" **사라짐** 확인!

**설명**: "Promote를 실행하여 Green 버전을 프로덕션으로 전환했습니다"

---

### Step 6: 다시 크리스마스 버전으로 롤백

**터미널 명령어**:
```bash
kubectl-argo-rollouts set image frontend frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas -n apc-fe-ns
```

**대시보드에서 확인** (5-10초 대기):
- Preview 버전 생성 중
- 크리스마스 버전 배포

**설명**: "다시 크리스마스 버전으로 롤백합니다"

---

### Step 7: Preview 확인 (크리스마스)

**브라우저 (Preview)**:
- http://192.168.0.170:30844 접속
- "Hello 크리스마스 🎄" **있음** 확인!

**브라우저 (프로덕션)**:
- https://alphacar.cloud 접속
- "Hello 크리스마스 🎄" **없음** (아직 프로덕션)

**설명**: "Preview에서 크리스마스 버전을 확인합니다"

---

### Step 8: Promote (크리스마스 복구)

**대시보드에서**:
1. `frontend` Rollout 선택
2. **"Promote" 버튼 클릭**

**또는 터미널**:
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**브라우저 (프로덕션)**:
- https://alphacar.cloud **새로고침** (Ctrl+Shift+R)
- "Hello 크리스마스 🎄" **다시 나타남** 확인!

**설명**: "크리스마스 버전이 다시 프로덕션에 반영되었습니다"

---

## 📋 전체 명령어 (복사용)

```bash
# Step 3: Green 배포 (크리스마스 제거)
kubectl-argo-rollouts set image frontend frontend=192.168.0.170:30000/alphacar/frontend:1.0.053-d53fade -n apc-fe-ns

# Step 5: Promote (Green으로 전환)
kubectl-argo-rollouts promote frontend -n apc-fe-ns

# Step 6: 크리스마스 버전으로 롤백
kubectl-argo-rollouts set image frontend frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas -n apc-fe-ns

# Step 8: Promote (크리스마스 복구)
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

---

## ✅ 정리

1. **초기**: 크리스마스 버전 (Hello 크리스마스 있음) ✅
2. **Green 배포**: 이전 버전 (Hello 크리스마스 없음)
3. **Promote**: Green으로 전환 (Hello 크리스마스 사라짐)
4. **롤백**: 크리스마스 버전 (Hello 크리스마스 다시 나타남)
5. **Preview**: http://192.168.0.170:30844 (NodePort) ✅

