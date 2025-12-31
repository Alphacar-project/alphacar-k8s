# Frontend "Hello 크리스마스" 배포 가이드

## ✅ 현재 상태

### 코드 수정 완료
- 파일: `dev/alphacar/frontend/app/page.tsx`
- 위치: 323번째 줄
- 내용: "고객님, 어떤 차를 찾으시나요?" 옆에 "Hello 크리스마스 🎄" 추가

### 이미지 빌드 완료
- 이미지: `192.168.0.170:30000/alphacar/frontend:1.0.054-christmas`
- 상태: 빌드 완료

---

## 🎯 대시보드에서 확인하는 방법

### Argo Rollouts 대시보드

1. **네임스페이스 선택**
   - 대시보드에서 `apc-fe-ns` 선택

2. **Rollout 확인**
   - `frontend` Rollout 클릭
   - 배포 상태 실시간 확인:
     - **Blue (Stable)**: 현재 프로덕션 (Hello 크리스마스 없음)
     - **Green (Preview)**: 새 버전 (Hello 크리스마스 있음)

3. **배포 과정 확인**
   - Preview 버전 생성 과정
   - Pod 상태 변화
   - Promote 후 트래픽 전환

---

## 🚀 배포 단계

### Step 1: 이미지 Push (완료)

```bash
docker push 192.168.0.170:30000/alphacar/frontend:1.0.054-christmas
```

### Step 2: Rollout에 배포 (완료)

```bash
kubectl-argo-rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas \
  -n apc-fe-ns
```

### Step 3: 대시보드에서 확인

**Argo Rollouts 대시보드:**
- 네임스페이스: `apc-fe-ns`
- Rollout: `frontend`
- Preview 버전 생성 확인

### Step 4: Preview 확인

**터미널에서:**
```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000
```

**브라우저에서:**
- http://localhost:8082 접근
- "고객님, 어떤 차를 찾으시나요? **Hello 크리스마스 🎄**" 확인!

### Step 5: Promote (프로덕션 전환)

**대시보드에서:**
- `frontend` Rollout의 **"Promote"** 버튼 클릭

**또는 터미널에서:**
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**브라우저에서:**
- https://alphacar.cloud 접근
- "고객님, 어떤 차를 찾으시나요? **Hello 크리스마스 🎄**" 확인!

---

## 📊 대시보드에서 볼 수 있는 것

### 배포 전
- **Stable**: `1.0.053-d53fade` (Hello 크리스마스 없음)
- **Preview**: 없음

### 배포 후 (Promote 전)
- **Stable**: `1.0.053-d53fade` (Hello 크리스마스 없음) ← 프로덕션
- **Preview**: `1.0.054-christmas` (Hello 크리스마스 있음) ← 테스트 중

### Promote 후
- **Stable**: `1.0.054-christmas` (Hello 크리스마스 있음) ← 프로덕션
- **Preview**: 없음 (스케일 다운)

---

## 🎬 시연 시나리오

### 화면 구성

**화면 1: Argo Rollouts 대시보드**
- `frontend` Rollout 상태 확인
- Blue-Green 전환 과정 시각화

**화면 2: 브라우저 (alphacar.cloud)**
- 배포 전: Hello 크리스마스 없음
- 배포 후: Hello 크리스마스 있음

**화면 3: 터미널 (선택)**
- CLI 명령어 실행
- 상태 확인

---

## 🔍 확인 방법

### 1. 대시보드에서 확인

**Argo Rollouts 대시보드:**
- Rollout 상태
- Pod 상태
- 이미지 버전
- 트래픽 분할 상태

### 2. 브라우저에서 확인

**프로덕션:**
- https://alphacar.cloud
- "Hello 크리스마스 🎄" 텍스트 확인

**Preview:**
- http://localhost:8082 (port-forward 후)
- "Hello 크리스마스 🎄" 텍스트 확인

---

## 💡 요약

**네, 대시보드에서 확인 가능합니다!**

1. ✅ **대시보드**: Rollout 상태, Pod 상태, 이미지 버전 확인
2. ✅ **브라우저**: 실제 웹사이트에서 "Hello 크리스마스" 확인
3. ✅ **Blue-Green 전환**: 대시보드에서 실시간으로 확인

**대시보드와 브라우저를 함께 사용하면 완벽한 시연이 가능합니다!**

