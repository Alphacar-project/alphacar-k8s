# Argo Rollouts 데모 애플리케이션 사용법

## 🎯 현재 상태

**화면이 이미 표시되고 있다면:**
- ✅ 애플리케이션이 정상적으로 실행 중입니다
- ✅ 파란색 그리드는 현재 Pod 상태를 보여줍니다
- ✅ START 버튼은 **선택사항**입니다

---

## 📊 화면 구성 설명

### 현재 보이는 것들

1. **파란색 그리드**
   - 현재 실행 중인 Pod를 나타냅니다
   - 각 파란색 사각형 = 1개의 Pod
   - 총 5개의 Pod가 실행 중이면 5개의 파란색 사각형이 보입니다

2. **COLOR: 파란색**
   - 현재 배포된 버전의 색상
   - Blue 버전이 실행 중

3. **LATENCY: 0s**
   - 현재 지연 시간 (0초 = 정상)

4. **ERROR: 0%**
   - 현재 에러율 (0% = 정상)

---

## 🎮 START 버튼의 역할

### START 버튼을 누르면:

1. **트래픽 시뮬레이션 시작**
   - 가상의 트래픽이 생성됩니다
   - 그리드가 더 활발하게 움직일 수 있습니다

2. **메트릭 수집 시작**
   - LATENCY와 ERROR 값이 변할 수 있습니다
   - 실제 배포 시나리오를 시뮬레이션합니다

### START 버튼을 누르지 않아도:

- ✅ 화면은 정상적으로 표시됩니다
- ✅ Blue-Green 배포 시연은 가능합니다
- ✅ 그리드는 현재 Pod 상태를 보여줍니다

---

## 🚀 Blue-Green 배포 시연 (START 없이도 가능)

### Step 1: 현재 상태 확인
- 화면에 파란색 그리드가 보이면 정상입니다
- START 버튼을 누르지 않아도 됩니다

### Step 2: 새 버전 배포 (Green)

**터미널에서:**
```bash
kubectl argo rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:green \
  -n rollouts-demo
```

**대시보드에서:**
- Preview 버전이 생성되는 것을 확인

### Step 3: Preview 확인

**다른 터미널에서:**
```bash
kubectl port-forward -n rollouts-demo svc/rollouts-demo-preview 8081:80
```

**브라우저에서:**
- http://localhost:8081 접근
- **초록색 그리드** 확인!

### Step 4: Promote

**대시보드에서:**
- "Promote" 버튼 클릭

**또는 터미널에서:**
```bash
kubectl argo rollouts promote rollouts-demo -n rollouts-demo
```

**브라우저에서:**
- http://localhost:8080 접근
- **초록색 그리드로 변경** 확인!

---

## 💡 START 버튼을 언제 사용하나요?

### START 버튼을 누르면 좋은 경우:

1. **트래픽 시뮬레이션**
   - 실제 트래픽이 들어오는 것처럼 시뮬레이션
   - LATENCY와 ERROR 값이 변함

2. **부하 테스트**
   - 애플리케이션에 부하를 주고 싶을 때
   - 성능 테스트 시나리오

3. **에러 시뮬레이션**
   - ERROR 슬라이더를 조절하고 START로 활성화
   - 에러 상황 시뮬레이션

### START 없이도 가능한 것:

- ✅ Blue-Green 배포 시연
- ✅ 색상 변경 확인
- ✅ Pod 상태 확인
- ✅ 롤백 시연

---

## 🎬 추천 시나리오

### 시나리오 1: START 없이 시연 (간단)

1. 화면 확인 (파란색 그리드)
2. Green 버전 배포
3. Preview 확인 (초록색)
4. Promote (초록색으로 변경)
5. 롤백 (파란색으로 복구)

**→ START 버튼 없이도 완벽하게 시연 가능!**

### 시나리오 2: START로 트래픽 시뮬레이션

1. START 버튼 클릭
2. LATENCY 슬라이더 조절 (예: 2s)
3. ERROR 슬라이더 조절 (예: 10%)
4. Green 버전 배포
5. 부하 상황에서 배포 테스트

---

## ✅ 결론

**현재 화면이 보이면:**
- ✅ 정상 작동 중입니다
- ✅ START 버튼을 누르지 않아도 Blue-Green 배포 시연 가능
- ✅ START는 트래픽 시뮬레이션이 필요할 때만 사용

**지금 바로 시연 시작 가능합니다!**

