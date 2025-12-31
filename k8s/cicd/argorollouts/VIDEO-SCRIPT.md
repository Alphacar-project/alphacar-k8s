# Blue-Green 배포 영상 촬영 스크립트

## 🎬 영상 촬영 시나리오

### 목표
1. "Hello 크리스마스 🎄" 있는 버전 → 원래 버전으로 롤백
2. rollouts-demo 색상 변화 시연 (Blue → Green → Blue)
3. 두 가지를 함께 시연하여 Blue-Green 배포 완벽 시연

---

## 📋 준비 단계

### Step 0: 초기 상태 확인

**터미널에서:**
```bash
# 1. Frontend Rollout 상태 확인
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns

# 2. Rollouts-demo 상태 확인
kubectl-argo-rollouts get rollout rollouts-demo -n rollouts-demo

# 3. 브라우저 준비
# - 탭 1: https://alphacar.cloud (프로덕션)
# - 탭 2: http://localhost:8081 (rollouts-demo Active)
# - 탭 3: http://localhost:8082 (rollouts-demo Preview)
```

**확인 사항:**
- Frontend: `1.0.054-christmas` (Hello 크리스마스 있음)
- Rollouts-demo: Blue 버전 실행 중

---

## 🎥 영상 촬영 순서

### Part 1: Frontend 롤백 시연 (Hello 크리스마스 제거)

#### Scene 1: 초기 상태 (5초)

**화면 구성:**
- **왼쪽**: Argo Rollouts 대시보드 (frontend Rollout)
- **오른쪽**: 브라우저 (https://alphacar.cloud)

**설명:**
- "현재 프로덕션에는 'Hello 크리스마스 🎄' 텍스트가 있습니다"
- "대시보드에서 현재 버전을 확인합니다"

**명령어:** 없음 (상태 확인만)

---

#### Scene 2: 롤백 시작 (10초)

**화면 구성:**
- **왼쪽**: 터미널 (명령어 입력)
- **오른쪽**: Argo Rollouts 대시보드

**설명:**
- "이제 이전 버전으로 롤백하겠습니다"
- "롤백 명령어를 실행합니다"

**터미널 명령어:**
```bash
kubectl-argo-rollouts undo frontend -n apc-fe-ns
```

**대시보드에서:**
- 롤백 진행 과정 확인
- 새 버전(이전 버전) 배포 시작

---

#### Scene 3: Preview 버전 생성 (15초)

**화면 구성:**
- **왼쪽**: Argo Rollouts 대시보드
- **오른쪽**: 브라우저 (Preview 확인)

**설명:**
- "Preview 버전이 생성되고 있습니다"
- "Preview에서 변경사항을 확인합니다"

**터미널 명령어:**
```bash
# Preview 서비스 Port Forward
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8083:8000
```

**브라우저:**
- http://localhost:8083 접근
- "Hello 크리스마스 🎄" 없음 확인!

---

#### Scene 4: Promote (프로덕션 전환) (10초)

**화면 구성:**
- **왼쪽**: Argo Rollouts 대시보드
- **오른쪽**: 브라우저 (프로덕션)

**설명:**
- "Preview 확인 후 프로덕션으로 전환합니다"
- "Promote 버튼을 클릭합니다"

**대시보드에서:**
- "Promote" 버튼 클릭

**또는 터미널:**
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**브라우저:**
- https://alphacar.cloud 새로고침
- "Hello 크리스마스 🎄" 사라진 것 확인!

---

### Part 2: Rollouts-demo 색상 변화 시연

#### Scene 5: Rollouts-demo 초기 상태 (5초)

**화면 구성:**
- **왼쪽**: Argo Rollouts 대시보드 (rollouts-demo)
- **오른쪽**: 브라우저 (http://localhost:8081)

**설명:**
- "이제 색상 변화로 Blue-Green 배포를 시연합니다"
- "현재 Blue 버전이 실행 중입니다"

**브라우저:**
- http://localhost:8081 → 파란색 그리드 확인

---

#### Scene 6: Green 버전 배포 (10초)

**화면 구성:**
- **왼쪽**: 터미널
- **오른쪽**: Argo Rollouts 대시보드

**설명:**
- "Green 버전을 배포합니다"

**터미널 명령어:**
```bash
kubectl-argo-rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:green \
  -n rollouts-demo
```

**대시보드에서:**
- Preview 버전 생성 확인
- Green Pod 생성 확인

---

#### Scene 7: Preview 확인 (Green) (10초)

**화면 구성:**
- **왼쪽**: 브라우저 (Active/Blue)
- **오른쪽**: 브라우저 (Preview/Green)

**설명:**
- "Preview에서 Green 버전을 확인합니다"
- "두 버전을 비교할 수 있습니다"

**브라우저:**
- http://localhost:8081 (Active) → 파란색 그리드
- http://localhost:8082 (Preview) → 초록색 그리드

---

#### Scene 8: Promote (Blue → Green 전환) (10초)

**화면 구성:**
- **왼쪽**: Argo Rollouts 대시보드
- **오른쪽**: 브라우저 (Active)

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

---

#### Scene 9: 롤백 (Green → Blue 복구) (10초)

**화면 구성:**
- **왼쪽**: Argo Rollouts 대시보드
- **오른쪽**: 브라우저 (Active)

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

---

## 📝 전체 명령어 순서 (복사용)

### Frontend 롤백 시연

```bash
# 1. 현재 상태 확인
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns

# 2. 롤백 실행
kubectl-argo-rollouts undo frontend -n apc-fe-ns

# 3. Preview 확인 (선택사항)
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8083:8000
# 브라우저: http://localhost:8083

# 4. Promote (프로덕션 전환)
kubectl-argo-rollouts promote frontend -n apc-fe-ns

# 5. 프로덕션 확인
# 브라우저: https://alphacar.cloud
```

### Rollouts-demo 색상 변화 시연

```bash
# 1. Green 버전 배포
kubectl-argo-rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:green \
  -n rollouts-demo

# 2. Preview 확인
# 브라우저: http://localhost:8082 (초록색)

# 3. Promote (Blue → Green)
kubectl-argo-rollouts promote rollouts-demo -n rollouts-demo

# 4. 롤백 (Green → Blue)
kubectl-argo-rollouts undo rollouts-demo -n rollouts-demo
```

---

## 🎬 추천 화면 구성

### 옵션 1: 분할 화면

**왼쪽 (50%):**
- Argo Rollouts 대시보드
- 터미널 (명령어 실행)

**오른쪽 (50%):**
- 브라우저 (alphacar.cloud)
- 브라우저 (rollouts-demo)

### 옵션 2: 전체 화면 전환

1. **대시보드 화면** (명령어 실행)
2. **브라우저 화면** (결과 확인)
3. **대시보드 화면** (상태 확인)
4. **브라우저 화면** (변경 확인)

---

## ⏱️ 예상 시간

- **Part 1 (Frontend 롤백)**: 약 1분
- **Part 2 (Rollouts-demo 색상)**: 약 1분
- **총 시간**: 약 2-3분

---

## 💡 영상 촬영 팁

### 1. 명령어 준비
- 명령어를 미리 복사해두기
- 타이핑 실수 방지

### 2. 대기 시간
- 각 명령어 실행 후 3-5초 대기
- 대시보드/브라우저 업데이트 시간 확보

### 3. 설명 포인트
- "현재 Hello 크리스마스가 있습니다"
- "롤백을 실행합니다"
- "Preview에서 확인합니다"
- "Promote로 프로덕션 전환합니다"
- "색상이 파란색에서 초록색으로 변경되었습니다"

---

## ✅ 체크리스트

영상 촬영 전:
- [ ] Argo Rollouts 대시보드 실행
- [ ] 브라우저 탭 준비 (alphacar.cloud, localhost:8081, localhost:8082)
- [ ] 명령어 복사 준비
- [ ] 현재 상태 확인

영상 촬영 중:
- [ ] Frontend 롤백 시연
- [ ] Rollouts-demo 색상 변화 시연
- [ ] 각 단계별 설명
- [ ] 대시보드와 브라우저 동시 확인

