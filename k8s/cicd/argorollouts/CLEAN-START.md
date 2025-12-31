# 🧹 정리 후 처음부터 시작

## Step 0: 현재 상태 정리

### 현재 상태 확인
```bash
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns
```

### ScaledDown된 ReplicaSet 정리 (자동)
- Argo Rollouts가 자동으로 정리합니다
- 수동 정리 불필요

---

## 🎬 영상 촬영 순서 (처음부터)

### Step 1: 대시보드 접속

**순서**:
1. 브라우저 열기
2. 주소 입력: `http://localhost:9003/rollouts/`
3. Enter
4. 대시보드 로딩 대기

**확인**: `frontend` Rollout 보임

---

### Step 2: 크리스마스 버전 배포

**목적**: "Hello 크리스마스 🎄" 있는 버전 배포

**터미널 명령어**:
```bash
kubectl-argo-rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas \
  -n apc-fe-ns
```

**대시보드 확인** (5-10초 대기):
- Preview 버전 생성 중
- 새 ReplicaSet 생성 확인

**설명**: "크리스마스 버전을 배포합니다"

---

### Step 3: Preview 상태 확인

**대시보드에서**:
- `frontend` Rollout 클릭
- Preview 버전 확인:
  - `frontend-xxxxx` (Preview로 표시)
  - Pod 상태: Running 확인

**브라우저 (프로덕션)**:
- https://alphacar.cloud 접속
- "Hello 크리스마스 🎄" **아직 없음** (이전 버전)

**설명**: "Preview 버전이 생성되었습니다. 아직 프로덕션은 이전 버전입니다"

---

### Step 4: Promote (크리스마스 버전으로 전환)

**대시보드에서**:
1. `frontend` Rollout 선택
2. **"Promote" 버튼 클릭** (오른쪽 하단)

**또는 터미널**:
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**대시보드에서 확인** (3-5초 대기):
- Preview → Stable/Active로 변경
- 이전 버전 → ScaledDown

**브라우저 (프로덕션)**:
- https://alphacar.cloud **새로고침** (Ctrl+Shift+R)
- "Hello 크리스마스 🎄" **나타남** 확인!

**설명**: "Promote를 실행하여 크리스마스 버전을 프로덕션으로 전환했습니다"

---

### Step 5: 이전 버전으로 롤백 배포

**목적**: "Hello 크리스마스 🎄" 없는 버전으로 롤백

**터미널 명령어**:
```bash
kubectl-argo-rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.053-d53fade \
  -n apc-fe-ns
```

**대시보드에서 확인** (5-10초 대기):
- 새 Preview 버전 생성 중
- 크리스마스 버전은 여전히 Active

**설명**: "이전 버전으로 롤백을 시작합니다"

---

### Step 6: Preview 상태 확인 (롤백)

**대시보드에서**:
- Preview 버전 확인:
  - `frontend-xxxxx` (Preview로 표시)
  - Pod 상태: Running 확인

**브라우저 (프로덕션)**:
- https://alphacar.cloud 접속
- "Hello 크리스마스 🎄" **여전히 있음** (아직 프로덕션)

**설명**: "Preview 버전이 생성되었습니다. 프로덕션은 아직 크리스마스 버전입니다"

---

### Step 7: Promote (롤백 완료)

**대시보드에서**:
1. `frontend` Rollout 선택
2. **"Promote" 버튼 클릭** (오른쪽 하단)

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

**설명**: "롤백이 완료되었습니다. 크리스마스 버전에서 이전 버전으로 되돌아갔습니다"

---

## 📋 전체 명령어 순서 (복사용)

```bash
# Step 2: 크리스마스 버전 배포
kubectl-argo-rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas \
  -n apc-fe-ns

# Step 4: Promote (크리스마스 버전으로 전환)
kubectl-argo-rollouts promote frontend -n apc-fe-ns

# Step 5: 이전 버전으로 롤백 배포
kubectl-argo-rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.053-d53fade \
  -n apc-fe-ns

# Step 7: Promote (롤백 완료)
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

---

## ✅ 체크리스트

### 촬영 전 준비
- [ ] Dashboard 실행: http://localhost:9003/rollouts/
- [ ] 브라우저 탭 준비: https://alphacar.cloud
- [ ] 명령어 복사 준비
- [ ] 현재 상태 확인 완료

### 촬영 중
- [ ] 각 단계별 설명
- [ ] 대시보드와 브라우저 동시 확인
- [ ] 명령어 실행 후 대기 시간 확보

---

## 💡 설명 포인트

1. **Step 2**: "크리스마스 버전을 배포합니다"
2. **Step 3**: "Preview 버전이 생성되었습니다"
3. **Step 4**: "Promote로 프로덕션에 반영합니다"
4. **Step 5**: "이전 버전으로 롤백을 시작합니다"
5. **Step 6**: "Preview에서 롤백 버전을 확인합니다"
6. **Step 7**: "롤백이 완료되었습니다"

