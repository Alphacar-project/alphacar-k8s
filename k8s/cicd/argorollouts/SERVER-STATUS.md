# 🖥️ 현재 서버 상태

## ⚠️ 문제 발견

**Rollout과 일반 Deployment가 동시에 실행 중입니다!**

---

## 📊 현재 상태

### 1. Argo Rollouts (Blue-Green)
- **Rollout 이름**: `frontend`
- **상태**: ✔ Healthy
- **전략**: BlueGreen
- **현재 이미지**: `1.0.053-d53fade` (크리스마스 없음)
- **Pod**: `frontend-668976b4cd-pmrmp` (1개)
- **서비스**: 
  - `frontend-stable` → Rollout Pod 가리킴 ✅
  - `frontend-preview` → NodePort (30844)

### 2. 일반 Deployment (충돌!)
- **Deployment 이름**: `frontend`
- **상태**: 실행 중
- **현재 이미지**: `1.0.055-dc7e918` (크리스마스 있음!)
- **Pod**: `frontend-787cd5dc65-4pt7m` (1개)
- **문제**: `frontend` 서비스가 이 Pod도 선택함 ⚠️

### 3. Service 상태
- **`frontend`** (ClusterIP): 
  - Endpoints: 2개 Pod 모두 선택
    - `10.244.1.186:8000` (Rollout Pod - 크리스마스 없음)
    - `10.244.82.105:8000` (Deployment Pod - 크리스마스 있음!)
  
- **`frontend-stable`** (ClusterIP):
  - Endpoints: Rollout Pod만 선택 ✅
  
- **`frontend-preview`** (NodePort):
  - Endpoints: Rollout Pod만 선택 ✅

---

## 🔍 문제 분석

1. **`frontend` 서비스**가 `app: frontend` 레이블로 두 Pod를 모두 선택
2. **VirtualService**가 `frontend-stable`을 가리키지만, 다른 경로에서 `frontend` 서비스를 사용할 수 있음
3. **Deployment Pod**가 크리스마스 버전을 제공 중

---

## ✅ 해결 방법

### 옵션 1: Deployment 삭제 (권장)
```bash
kubectl delete deployment frontend -n apc-fe-ns
```

### 옵션 2: Deployment 스케일 다운
```bash
kubectl scale deployment frontend --replicas=0 -n apc-fe-ns
```

---

## 📝 권장 사항

1. **Deployment 삭제**: Rollout만 사용하도록 정리
2. **`frontend` 서비스 확인**: VirtualService가 `frontend-stable`을 가리키는지 확인
3. **모니터링**: Rollout만 실행되도록 확인

---

## 🎯 현재 접속 경로

- **프로덕션**: `https://alphacar.cloud` → VirtualService → `frontend-stable` → Rollout Pod (크리스마스 없음) ✅
- **Preview**: `http://192.168.0.170:30844` → `frontend-preview` → Rollout Pod

**주의**: `frontend` 서비스를 직접 사용하는 경우, 두 Pod 중 하나가 랜덤으로 선택될 수 있습니다!

