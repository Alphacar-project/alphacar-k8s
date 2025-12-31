# Rollouts-demo 앱 설명

## 🎯 Rollouts-demo 앱이란?

Argo Rollouts의 공식 데모 앱으로, **Blue-Green 배포와 Canary 배포를 시각적으로 확인**할 수 있는 웹 애플리케이션입니다.

---

## 📊 화면 구성

### 1. 상단 컨트롤 패널
- **COLOR**: 현재 활성화된 버전의 색상 표시
  - Blue 버전: 파란색
  - Green 버전: 초록색
- **LATENCY**: 응답 지연 시간 조정 (0s ~ 10s)
- **ERROR**: 에러율 조정 (0% ~ 100%)
- **START/STOP**: 앱 시작/중지

### 2. 메인 그리드
- 각 사각형 = 하나의 Pod 인스턴스
- **파란색 사각형**: Blue 버전의 정상 Pod
- **초록색 사각형**: Green 버전의 정상 Pod
- **빨간 테두리**: 에러 상태인 Pod (ERROR 슬라이더로 조정)

---

## ⚠️ 에러가 보이는 이유

### 정상적인 동작입니다!

**ERROR 슬라이더가 37%로 설정되어 있어서** 일부 Pod가 에러 상태로 표시되고 있습니다.

이것은:
- ✅ **정상적인 기능**입니다
- ✅ **에러율 시뮬레이션**을 위한 기능입니다
- ✅ **Canary 배포 시 자동 롤백 테스트**에 사용됩니다

---

## 🔧 에러 제거 방법

### 방법 1: ERROR 슬라이더 조정
1. 브라우저에서 http://localhost:9001 접속
2. 상단의 **ERROR 슬라이더를 0%로 조정**
3. 빨간 테두리가 사라집니다!

### 방법 2: 앱 재시작
```bash
# Pod 재시작
kubectl rollout restart rollout rollouts-demo -n rollouts-demo
```

---

## 💡 Rollouts-demo 앱의 용도

### 1. Blue-Green 배포 시연
- Blue 버전과 Green 버전을 시각적으로 비교
- 색상 변화로 배포 상태 확인

### 2. Canary 배포 테스트
- ERROR 슬라이더로 에러율 조정
- 자동 롤백 기능 테스트

### 3. 레이턴시 테스트
- LATENCY 슬라이더로 응답 지연 시뮬레이션
- 성능 기반 자동 롤백 테스트

---

## 🎬 영상 촬영 시 사용법

### 에러 없이 깔끔하게 촬영하려면:

1. **ERROR 슬라이더를 0%로 설정**
2. **LATENCY 슬라이더를 0s로 설정**
3. **START 버튼 클릭** (이미 실행 중이면 생략)

이렇게 하면 모든 Pod가 정상 상태(파란색/초록색)로 표시됩니다!

---

## 📋 현재 상태 확인

```bash
# Pod 상태 확인
kubectl get pods -n rollouts-demo -l app=rollouts-demo

# Rollout 상태 확인
kubectl-argo-rollouts get rollout rollouts-demo -n rollouts-demo
```

---

## ✅ 정리

- **에러가 보이는 것은 정상입니다** (ERROR 슬라이더 설정 때문)
- **ERROR 슬라이더를 0%로 조정**하면 에러가 사라집니다
- **영상 촬영 전에 슬라이더를 조정**하는 것을 권장합니다
