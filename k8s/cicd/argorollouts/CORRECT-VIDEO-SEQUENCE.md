# 🎬 올바른 영상 촬영 순서

## ✅ 초기 상태 설정 완료

- ✅ **프로덕션: 크리스마스 버전** (Hello 크리스마스 있음)
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

---

### Step 2: 초기 상태 확인
**브라우저 (프로덕션)**:
- https://alphacar.cloud 접속
- "Hello 크리스마스 🎄" **있음** 확인

**설명**: "현재 프로덕션에는 Hello 크리스마스가 있습니다"

---

### Step 3: 롤백 배포 (크리스마스 제거)

**터미널 명령어**:
```bash
kubectl-argo-rollouts set image frontend frontend=192.168.0.170:30000/alphacar/frontend:1.0.053-d53fade -n apc-fe-ns
```

**대시보드에서 확인** (5-10초 대기):
- Preview 버전 생성 중

**설명**: "이전 버전으로 롤백을 시작합니다"

---

### Step 4: Preview 확인

**브라우저 (Preview)**:
- http://192.168.0.170:30844 접속
- "Hello 크리스마스 🎄" **없음** 확인!

**브라우저 (프로덕션)**:
- https://alphacar.cloud 접속
- "Hello 크리스마스 🎄" **여전히 있음**

**설명**: "Preview에서 롤백 버전을 확인합니다"

---

### Step 5: Promote (롤백 완료)

**터미널 명령어**:
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**브라우저 (프로덕션)**:
- https://alphacar.cloud **새로고침**
- "Hello 크리스마스 🎄" **사라짐** 확인!

**설명**: "롤백이 완료되었습니다. 크리스마스가 사라졌습니다"

---

### Step 6: 다시 크리스마스 버전으로 롤백

**터미널 명령어**:
```bash
kubectl-argo-rollouts set image frontend frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas -n apc-fe-ns
```

**대시보드에서 확인** (5-10초 대기):
- Preview 버전 생성 중

**설명**: "다시 크리스마스 버전으로 롤백합니다"

---

### Step 7: Preview 확인 (크리스마스)

**브라우저 (Preview)**:
- http://192.168.0.170:30844 접속
- "Hello 크리스마스 🎄" **있음** 확인!

**설명**: "Preview에서 크리스마스 버전을 확인합니다"

---

### Step 8: Promote (크리스마스 복구)

**터미널 명령어**:
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**브라우저 (프로덕션)**:
- https://alphacar.cloud **새로고침**
- "Hello 크리스마스 🎄" **다시 나타남** 확인!

**설명**: "크리스마스 버전이 다시 프로덕션에 반영되었습니다"

---

## 📋 전체 명령어 (복사용)

```bash
# Step 3: 롤백 배포 (크리스마스 제거)
kubectl-argo-rollouts set image frontend frontend=192.168.0.170:30000/alphacar/frontend:1.0.053-d53fade -n apc-fe-ns

# Step 5: Promote (롤백 완료)
kubectl-argo-rollouts promote frontend -n apc-fe-ns

# Step 6: 크리스마스 버전으로 롤백
kubectl-argo-rollouts set image frontend frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas -n apc-fe-ns

# Step 8: Promote (크리스마스 복구)
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

---

## ✅ 정리

1. **초기**: 크리스마스 버전 (Hello 크리스마스 있음) ✅
2. **롤백**: 이전 버전 (Hello 크리스마스 없음)
3. **다시 롤백**: 크리스마스 버전 (Hello 크리스마스 다시 나타남)
4. **Preview**: http://192.168.0.170:30844 (NodePort) ✅

