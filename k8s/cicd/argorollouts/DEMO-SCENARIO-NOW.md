# 🎬 Blue-Green 배포 시나리오 (현재 상태 기준)

## 📊 현재 상태

### Frontend
- ✅ **현재 버전**: `1.0.054-christmas` (Hello 크리스마스 🎄 있음)
- ✅ **상태**: Healthy, Active
- ✅ **시나리오**: 크리스마스 버전 → 원래 버전으로 롤백

### Rollouts-demo
- ✅ **현재 버전**: Blue (Active)
- ✅ **Preview 버전**: Green (이미 배포됨, Paused 상태)
- ✅ **시나리오**: Green Promote → 롤백

---

## 🎥 영상 촬영 순서

### Part 1: Frontend 롤백 (Hello 크리스마스 제거)

#### Step 1: 초기 상태 확인 (5초)
**대시보드**: http://localhost:9003/rollouts/
- `frontend` Rollout 확인
- 현재 버전: `1.0.054-christmas`

**브라우저**: https://alphacar.cloud
- "고객님, 어떤 차를 찾으시나요? Hello 크리스마스 🎄" 확인

**명령어**: 없음

---

#### Step 2: 롤백 실행 (10초)
**터미널 명령어**:
```bash
kubectl-argo-rollouts undo frontend -n apc-fe-ns
```

**대시보드에서 확인**:
- 롤백 진행 중
- Preview 버전 생성
- 이전 버전으로 롤백

**대기**: 5초

---

#### Step 3: Preview 확인 (15초)
**터미널 명령어** (새 터미널):
```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8083:8000
```

**브라우저**: http://localhost:8083
- "Hello 크리스마스 🎄" **없음** 확인!

**대기**: 3초

---

#### Step 4: Promote (프로덕션 전환) (10초)
**대시보드**: "Promote" 버튼 클릭

**또는 터미널**:
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**브라우저**: https://alphacar.cloud 새로고침
- "Hello 크리스마스 🎄" **사라짐** 확인!

**대기**: 5초

---

### Part 2: Rollouts-demo 색상 변화

#### Step 5: 초기 상태 (5초)
**브라우저**: http://localhost:9001
- 파란색 그리드 확인

**대시보드**: `rollouts-demo` Rollout 확인
- Blue (Active)
- Green (Preview, Paused)

**명령어**: 없음

---

#### Step 6: Green Promote (10초)
**대시보드**: "Promote" 버튼 클릭

**또는 터미널**:
```bash
kubectl-argo-rollouts promote rollouts-demo -n rollouts-demo
```

**대시보드에서 확인**:
- Green 버전으로 전환 중

**대기**: 5초

---

#### Step 7: 색상 변경 확인 (10초)
**브라우저**: http://localhost:9001 새로고침
- **파란색 → 초록색** 변경 확인!

**브라우저**: http://localhost:9002 (Preview)
- 초록색 확인

**대기**: 3초

---

#### Step 8: 롤백 (Green → Blue) (10초)
**대시보드**: "Abort" 또는 "Retry" 버튼 클릭

**또는 터미널**:
```bash
kubectl-argo-rollouts undo rollouts-demo -n rollouts-demo
```

**브라우저**: http://localhost:9001 새로고침
- **초록색 → 파란색** 복구 확인!

**대기**: 5초

---

## 📋 전체 명령어 (복사용)

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
# 1. Green Promote (이미 배포되어 있음)
kubectl-argo-rollouts promote rollouts-demo -n rollouts-demo

# 2. 롤백
kubectl-argo-rollouts undo rollouts-demo -n rollouts-demo
```

---

## 🎬 화면 구성 추천

### 옵션 1: 분할 화면
- **왼쪽**: 대시보드 + 터미널
- **오른쪽**: 브라우저 (alphacar.cloud, localhost:9001)

### 옵션 2: 전체 화면 전환
1. 대시보드 → 명령어 실행
2. 브라우저 → 결과 확인
3. 반복

---

## ⏱️ 예상 시간

- **Part 1 (Frontend)**: 약 1분
- **Part 2 (Rollouts-demo)**: 약 1분
- **총 시간**: 약 2-3분

---

## ✅ 체크리스트

### 촬영 전
- [x] Dashboard 실행: http://localhost:9003/rollouts/
- [ ] 브라우저 탭 준비:
  - [ ] https://alphacar.cloud
  - [ ] http://localhost:9001 (Blue)
  - [ ] http://localhost:9002 (Green)
  - [ ] http://localhost:8083 (Frontend Preview)
- [ ] 명령어 복사 준비

### 촬영 중
- [ ] 각 명령어 실행 후 대기 (3-5초)
- [ ] 대시보드와 브라우저 동시 확인
- [ ] 설명 포인트 준비

---

## 💡 설명 포인트

1. **초기 상태**: "현재 Hello 크리스마스가 있습니다"
2. **롤백**: "롤백을 실행하여 이전 버전으로 되돌립니다"
3. **Preview**: "Preview에서 변경사항을 확인합니다"
4. **Promote**: "Promote로 프로덕션에 반영합니다"
5. **색상 변화**: "파란색에서 초록색으로 변경되었습니다"
6. **롤백**: "롤백으로 다시 파란색으로 복구되었습니다"

