# 대시보드에서 서비스 변경 확인 가이드

## ✅ 답변: 네, 대시보드에서 확인 가능합니다!

**Argo Rollouts 대시보드에서 실제 alphacar.cloud 서비스의 변경사항을 확인할 수 있습니다!**

---

## 📊 대시보드에서 확인하는 방법

### 1. Argo Rollouts 대시보드 접근

**터미널에서:**
```bash
kubectl-argo-rollouts dashboard
```

**브라우저에서:**
- http://localhost:3100 접근

---

### 2. 네임스페이스 선택

**대시보드에서:**
1. 상단의 **"NAMESPACE"** 필드 클릭
2. **`apc-fe-ns`** 선택
3. **`frontend`** Rollout 확인

---

### 3. 배포 상태 확인

**대시보드에서 볼 수 있는 정보:**

#### 배포 전
- **Stable**: `1.0.053-d53fade` (Hello 크리스마스 없음)
- **Preview**: 없음
- **Status**: Healthy

#### 새 버전 배포 후 (Promote 전)
- **Stable**: `1.0.053-d53fade` (Hello 크리스마스 없음) ← 프로덕션
- **Preview**: `1.0.054-christmas` (Hello 크리스마스 있음) ← 테스트 중
- **Status**: Paused (승인 대기)

#### Promote 후
- **Stable**: `1.0.054-christmas` (Hello 크리스마스 있음) ← 프로덕션
- **Preview**: 없음 (스케일 다운)
- **Status**: Healthy

---

## 🎬 실제 시연 시나리오

### Step 1: 초기 상태 확인

**대시보드:**
- `frontend` Rollout 클릭
- Stable 버전: `1.0.053-d53fade` 확인

**브라우저:**
- https://alphacar.cloud 접근
- "고객님, 어떤 차를 찾으시나요?" 확인 (Hello 크리스마스 없음)

---

### Step 2: 새 버전 배포

**터미널:**
```bash
kubectl-argo-rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas \
  -n apc-fe-ns
```

**대시보드에서:**
- Preview 버전 생성 확인
- Pod 상태 변화 확인
- 이미지 버전 변경 확인

---

### Step 3: Preview 확인

**터미널:**
```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000
```

**브라우저:**
- http://localhost:8082 접근
- "고객님, 어떤 차를 찾으시나요? **Hello 크리스마스 🎄**" 확인!

---

### Step 4: Promote (프로덕션 전환)

**대시보드에서:**
- `frontend` Rollout의 **"Promote"** 버튼 클릭

**또는 터미널:**
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**대시보드에서:**
- 트래픽 전환 과정 확인
- Stable 버전 변경 확인

**브라우저:**
- https://alphacar.cloud 접근
- "고객님, 어떤 차를 찾으시나요? **Hello 크리스마스 🎄**" 확인!

---

### Step 5: 롤백

**대시보드에서:**
- **"Abort"** 또는 **"Retry"** 버튼 클릭

**또는 터미널:**
```bash
kubectl-argo-rollouts undo frontend -n apc-fe-ns
```

**브라우저:**
- https://alphacar.cloud 접근
- "Hello 크리스마스 🎄" 사라진 것 확인!

---

## 📋 대시보드에서 확인할 수 있는 정보

### Rollout 상세 정보

1. **이미지 버전**
   - Stable 버전 이미지
   - Preview 버전 이미지
   - 버전 비교

2. **Pod 상태**
   - Stable Pod 수
   - Preview Pod 수
   - 각 Pod의 상태

3. **트래픽 분할**
   - 현재 트래픽이 어느 버전으로 가는지
   - Blue-Green 전환 상태

4. **배포 단계**
   - 현재 진행 단계
   - 다음 단계

---

## 🎯 화면 구성 추천

### 추천 레이아웃

**화면 1 (왼쪽 또는 위):** Argo Rollouts 대시보드
- Rollout 상태
- Pod 상태
- 이미지 버전

**화면 2 (오른쪽 또는 아래):** 브라우저
- https://alphacar.cloud (프로덕션)
- http://localhost:8082 (Preview)

**화면 3 (선택):** 터미널
- CLI 명령어 실행

---

## 💡 핵심 포인트

### 대시보드의 장점

1. **실시간 상태 확인**
   - 배포 진행 상황 실시간 확인
   - Pod 생성/삭제 과정 확인

2. **버전 비교**
   - Stable vs Preview 버전 비교
   - 이미지 태그 확인

3. **제어 기능**
   - Promote 버튼
   - Rollback 버튼
   - Pause/Resume 버튼

4. **시각화**
   - Pod 상태 시각화
   - 트래픽 분할 시각화

---

## ✅ 결론

**네, 대시보드에서 완벽하게 확인 가능합니다!**

1. ✅ **대시보드**: Rollout 상태, Pod 상태, 이미지 버전 확인
2. ✅ **브라우저**: 실제 웹사이트에서 "Hello 크리스마스" 확인
3. ✅ **Blue-Green 전환**: 대시보드에서 실시간으로 확인

**대시보드와 브라우저를 함께 사용하면 완벽한 시연이 가능합니다!**

