# Argo Rollouts 데모 애플리케이션 접근 가이드

## 🎯 배포 완료!

**Argo Rollouts 공식 데모 애플리케이션이 배포되었습니다!**

---

## 🌐 접근 방법

### 방법 1: Port Forward (가장 간단)

**터미널에서 실행:**

```bash
kubectl port-forward -n rollouts-demo svc/rollouts-demo-active 8080:80
```

**브라우저에서:**
- http://localhost:8080 접근
- "ARGO ROLLOUTS DEMO" 화면 확인!

---

### 방법 2: 여러 인스턴스 실행 (비교용)

**터미널 1:**
```bash
kubectl port-forward -n rollouts-demo svc/rollouts-demo-active 8080:80
```

**터미널 2:**
```bash
kubectl port-forward -n rollouts-demo svc/rollouts-demo-preview 8081:80
```

**브라우저:**
- http://localhost:8080 (Active/Blue)
- http://localhost:8081 (Preview/Green)

---

## 🎬 데모 애플리케이션 기능

### 컨트롤 패널

1. **COLOR**: 현재 버전 색상 표시
2. **START/STOP**: 애플리케이션 시작/중지
3. **LATENCY**: 지연 시간 조절 (0s ~ 10s)
4. **ERROR**: 에러율 조절 (0% ~ 100%)

### 그리드 표시

- **파란색 사각형**: 정상 Pod
- **회색 사각형**: 비정상/비활성 Pod
- **실시간 상태**: Pod 상태를 시각적으로 확인

---

## 🚀 Blue-Green 배포 시연

### Step 1: 초기 상태 확인

```bash
# Active 서비스 접근
kubectl port-forward -n rollouts-demo svc/rollouts-demo-active 8080:80
```

**브라우저에서:**
- http://localhost:8080 접근
- 파란색 그리드 확인

---

### Step 2: 새 버전 배포 (Green 버전)

```bash
# Green 버전으로 이미지 변경
kubectl argo rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:green \
  -n rollouts-demo
```

**대시보드에서:**
- Preview 버전 생성 확인
- Green 버전 Pod 확인

---

### Step 3: Preview 버전 확인

```bash
# Preview 서비스 접근
kubectl port-forward -n rollouts-demo svc/rollouts-demo-preview 8081:80
```

**브라우저에서:**
- http://localhost:8081 접근
- 초록색 그리드 확인!

---

### Step 4: Promote (Blue → Green 전환)

**대시보드에서:**
- `rollouts-demo` Rollout의 **"Promote"** 버튼 클릭

**또는 터미널에서:**
```bash
kubectl argo rollouts promote rollouts-demo -n rollouts-demo
```

**브라우저에서:**
- http://localhost:8080 접근
- 초록색 그리드로 변경 확인!

---

### Step 5: 롤백 (Green → Blue 복구)

**대시보드에서:**
- `rollouts-demo` Rollout의 **"Abort"** 또는 **"Retry"** 버튼 클릭

**또는 터미널에서:**
```bash
kubectl argo rollouts undo rollouts-demo -n rollouts-demo
```

**브라우저에서:**
- http://localhost:8080 접근
- 파란색 그리드로 복구 확인!

---

## 📊 대시보드에서 확인

### Argo Rollouts 대시보드

1. **네임스페이스**: `rollouts-demo` 선택
2. **Rollout**: `rollouts-demo` 확인
3. **상태**: Blue-Green 배포 상태 실시간 확인

---

## 🎨 사용 가능한 색상 버전

```bash
# Blue (기본)
argoproj/rollouts-demo:blue

# Green
argoproj/rollouts-demo:green

# Yellow
argoproj/rollouts-demo:yellow

# Red
argoproj/rollouts-demo:red
```

---

## 💡 팁

### 여러 색상으로 배포 테스트

```bash
# Yellow 버전 배포
kubectl argo rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:yellow \
  -n rollouts-demo

# Preview 확인 후 Promote
kubectl argo rollouts promote rollouts-demo -n rollouts-demo
```

### LATENCY/ERROR 조절 테스트

1. 브라우저에서 LATENCY 슬라이더 조절
2. 지연 시간 증가 확인
3. ERROR 슬라이더 조절
4. 에러율 증가 확인

---

## ✅ 체크리스트

데모 준비:
- [ ] Rollout 배포 확인
- [ ] Pod 실행 확인
- [ ] Port Forward 실행
- [ ] 브라우저에서 접근 확인

시연:
- [ ] 초기 상태 (Blue) 확인
- [ ] 새 버전 (Green) 배포
- [ ] Preview 확인
- [ ] Promote 실행
- [ ] 프로덕션에서 Green 확인
- [ ] 롤백 실행
- [ ] Blue로 복구 확인

---

## 🚀 지금 바로 시작!

```bash
# Port Forward 실행
kubectl port-forward -n rollouts-demo svc/rollouts-demo-active 8080:80
```

**브라우저에서 http://localhost:8080 접근하세요!**

