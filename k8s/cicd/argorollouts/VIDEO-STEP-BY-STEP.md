# 영상 촬영 단계별 가이드

## 🎬 영상 촬영 순서

---

## 📋 Part 1: Frontend 롤백 (Hello 크리스마스 제거)

### Step 1: 초기 상태 확인 (5초)

**화면:** 대시보드 + 브라우저 (alphacar.cloud)**

**설명:**
- "현재 프로덕션에는 'Hello 크리스마스 🎄' 텍스트가 있습니다"
- "대시보드에서 현재 버전을 확인합니다"

**명령어:** 없음

**확인:**
- 브라우저: https://alphacar.cloud → "Hello 크리스마스 🎄" 확인

---

### Step 2: 롤백 실행 (10초)

**화면:** 터미널 + 대시보드**

**설명:**
- "이전 버전으로 롤백하겠습니다"

**터미널 명령어:**
```bash
kubectl-argo-rollouts undo frontend -n apc-fe-ns
```

**대기:** 5초 (대시보드에서 롤백 진행 확인)

---

### Step 3: Preview 확인 (15초)

**화면:** 브라우저 (Preview)**

**설명:**
- "Preview 버전에서 변경사항을 확인합니다"

**터미널 명령어:**
```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8083:8000
```

**브라우저:**
- http://localhost:8083 접근
- "Hello 크리스마스 🎄" 없음 확인!

**대기:** 3초

---

### Step 4: Promote (프로덕션 전환) (10초)

**화면:** 대시보드 + 브라우저 (프로덕션)**

**설명:**
- "Promote로 프로덕션에 반영합니다"

**대시보드에서:**
- "Promote" 버튼 클릭

**또는 터미널:**
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**브라우저:**
- https://alphacar.cloud 새로고침
- "Hello 크리스마스 🎄" 사라진 것 확인!

**대기:** 5초

---

## 🎨 Part 2: Rollouts-demo 색상 변화

### Step 5: 초기 상태 (5초)

**화면:** 브라우저 (rollouts-demo)**

**설명:**
- "이제 색상 변화로 Blue-Green 배포를 시연합니다"
- "현재 Blue 버전이 실행 중입니다"

**브라우저:**
- http://localhost:8081 → 파란색 그리드 확인

**명령어:** 없음

---

### Step 6: Green 버전 배포 (10초)

**화면:** 터미널 + 대시보드**

**설명:**
- "Green 버전을 배포합니다"

**터미널 명령어:**
```bash
kubectl-argo-rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:green \
  -n rollouts-demo
```

**대기:** 5초 (대시보드에서 Preview 생성 확인)

---

### Step 7: Preview 확인 (10초)

**화면:** 브라우저 2개 (나란히)**

**설명:**
- "Preview에서 Green 버전을 확인합니다"
- "두 버전을 비교할 수 있습니다"

**브라우저:**
- 왼쪽: http://localhost:8081 (Active/Blue) → 파란색
- 오른쪽: http://localhost:8082 (Preview/Green) → 초록색

**대기:** 3초

---

### Step 8: Promote (Blue → Green) (10초)

**화면:** 대시보드 + 브라우저**

**설명:**
- "Promote를 실행하여 Green 버전으로 전환합니다"

**대시보드에서:**
- "Promote" 버튼 클릭

**또는 터미널:**
```bash
kubectl-argo-rollouts promote rollouts-demo -n rollouts-demo
```

**브라우저:**
- http://localhost:8081 새로고침
- **파란색 → 초록색으로 변경** 확인!

**대기:** 5초

---

### Step 9: 롤백 (Green → Blue) (10초)

**화면:** 대시보드 + 브라우저**

**설명:**
- "롤백을 실행하여 Blue 버전으로 복구합니다"

**대시보드에서:**
- "Abort" 또는 "Retry" 버튼 클릭

**또는 터미널:**
```bash
kubectl-argo-rollouts undo rollouts-demo -n rollouts-demo
```

**브라우저:**
- http://localhost:8081 새로고침
- **초록색 → 파란색으로 복구** 확인!

**대기:** 5초

---

## 📝 전체 명령어 (복사용)

### Frontend 롤백
```bash
# 1. 롤백
kubectl-argo-rollouts undo frontend -n apc-fe-ns

# 2. Preview 확인 (선택)
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8083:8000

# 3. Promote
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

### Rollouts-demo 색상
```bash
# 1. Green 배포
kubectl-argo-rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:green \
  -n rollouts-demo

# 2. Promote
kubectl-argo-rollouts promote rollouts-demo -n rollouts-demo

# 3. 롤백
kubectl-argo-rollouts undo rollouts-demo -n rollouts-demo
```

---

## 🎥 화면 구성 추천

### 옵션 1: 분할 화면
- **왼쪽 (50%)**: 대시보드 + 터미널
- **오른쪽 (50%)**: 브라우저 2개 (나란히)

### 옵션 2: 전체 화면 전환
1. 대시보드 (명령어 실행)
2. 브라우저 (결과 확인)
3. 대시보드 (상태 확인)
4. 브라우저 (변경 확인)

---

## ⏱️ 예상 시간

- **Part 1 (Frontend)**: 약 1분
- **Part 2 (Rollouts-demo)**: 약 1분
- **총 시간**: 약 2-3분

---

## ✅ 체크리스트

### 촬영 전
- [ ] 대시보드 실행
- [ ] 브라우저 탭 준비
- [ ] 명령어 복사 준비
- [ ] Port Forward 실행 (rollouts-demo)

### 촬영 중
- [ ] 각 명령어 실행 후 대기
- [ ] 대시보드와 브라우저 동시 확인
- [ ] 설명 포인트 준비

