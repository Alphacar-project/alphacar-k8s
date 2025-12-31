# 기존 VirtualService와 Argo Rollouts 통합

## 🔍 현재 상황

### 기존 VirtualService
- **파일**: `k8s/backend/alphacar-routing.yaml`
- **이름**: `alphacar-routing`
- **네임스페이스**: `apc-fe-ns`
- **기능**: 전체 서비스 라우팅 (main-backend 포함)
- **main-backend 라우팅**: `/api/main` → `main-backend.apc-be-ns.svc.cluster.local:3002`

### Argo Rollouts가 생성할 VirtualService
- **이름**: `main-backend-vs` (Rollout에서 지정)
- **네임스페이스**: `apc-be-ns`
- **기능**: main-backend의 Blue-Green 트래픽 제어
- **대상**: `main-backend-stable` 서비스

---

## ⚠️ 충돌 가능성

### 시나리오 1: 두 VirtualService가 공존
- `alphacar-routing`: `/api/main` → `main-backend` (기존)
- `main-backend-vs`: `main-backend-stable` → Blue-Green 제어 (Argo Rollouts)

**문제**: 두 VirtualService가 같은 경로를 처리하려고 할 수 있음

### 시나리오 2: 기존 VirtualService 수정 필요
- Argo Rollouts는 `main-backend-stable` 서비스를 사용
- 기존 VirtualService는 `main-backend` 서비스를 사용
- **포트도 다름**: 기존은 3002, Rollout은 3000

---

## 🎯 해결 방법

### 방법 1: 기존 VirtualService 수정 (추천)

기존 `alphacar-routing` VirtualService를 수정하여 Argo Rollouts가 관리하는 서비스를 사용:

```yaml
# k8s/backend/alphacar-routing.yaml 수정
- match:
    - uri:
        prefix: /api/main
    rewrite:
      uri: /main
    route:
    - destination:
        host: main-backend-stable.apc-be-ns.svc.cluster.local  # 변경
        port:
          number: 3000  # 변경 (Rollout의 Service 포트)
```

**장점:**
- 기존 라우팅 구조 유지
- Argo Rollouts와 자연스럽게 통합

**단점:**
- 기존 VirtualService 수정 필요
- 다른 서비스 라우팅도 확인 필요

### 방법 2: Argo Rollouts VirtualService만 사용

기존 VirtualService에서 main-backend 라우팅 제거하고, Argo Rollouts가 생성하는 VirtualService가 전체를 관리:

```yaml
# Argo Rollouts가 생성하는 VirtualService에 경로 추가
# (하지만 Argo Rollouts는 자동 생성하므로 수정 불가)
```

**문제**: Argo Rollouts가 생성하는 VirtualService는 자동이므로 수동 수정 불가

### 방법 3: 별도 경로 사용 (비추천)

Argo Rollouts용 별도 경로 사용:
- 기존: `/api/main` → `main-backend`
- 새: `/api/main-v2` → `main-backend-stable`

**단점**: 클라이언트 코드 수정 필요

---

## ✅ 추천 솔루션: 방법 1

### Step 1: 기존 VirtualService 수정

`k8s/backend/alphacar-routing.yaml`에서 main-backend 관련 부분 수정:

```yaml
# 기존
- match:
    - uri:
        prefix: /api/main
    rewrite:
      uri: /main
    route:
    - destination:
        host: main-backend.apc-be-ns.svc.cluster.local
        port:
          number: 3002

# 변경 후
- match:
    - uri:
        prefix: /api/main
    rewrite:
      uri: /main
    route:
    - destination:
        host: main-backend-stable.apc-be-ns.svc.cluster.local  # Rollout의 Service 사용
        port:
          number: 3000  # Rollout의 Service 포트
```

### Step 2: Argo Rollouts 설정 확인

Rollout의 VirtualService가 Gateway를 올바르게 참조하는지 확인:

```yaml
# main-backend-rollout-bluegreen.yaml
trafficManagement:
  istio:
    virtualService:
      name: main-backend-vs
      routes:
      - primary
    destinationRule:
      name: main-backend-dr
```

### Step 3: Argo Rollouts VirtualService 설정

Argo Rollouts가 생성하는 VirtualService가 기존 Gateway와 호환되도록:

**주의**: Argo Rollouts가 생성하는 VirtualService는 자동이므로, Rollout 설정만 올바르게 하면 됩니다.

---

## 🔧 실제 통합 예시

### 기존 VirtualService (수정 후)
```yaml
# k8s/backend/alphacar-routing.yaml
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: alphacar-routing
  namespace: apc-fe-ns
spec:
  gateways:
  - istio-system/alphacar-gateway
  hosts:
  - alphacar.cloud
  http:
  # ... 다른 서비스 라우팅 ...
  
  # Main Backend - Argo Rollouts와 통합
  - match:
      - uri:
          prefix: /api/main
      rewrite:
        uri: /main
      route:
      - destination:
          host: main-backend-stable.apc-be-ns.svc.cluster.local  # Rollout Service
          port:
            number: 3000  # Rollout Service 포트
```

### Argo Rollouts VirtualService (자동 생성)
```yaml
# Argo Rollouts가 자동 생성
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: main-backend-vs
  namespace: apc-be-ns
spec:
  hosts:
  - main-backend-stable  # Service 이름
  gateways:
  - alphacar-gateway  # Gateway 참조
  http:
  - name: primary
    route:
    - destination:
        host: main-backend-stable
        subset: stable  # Blue-Green 전환 시 preview로 변경
      weight: 100
```

**작동 방식:**
1. 외부 트래픽 → Gateway → `alphacar-routing` VirtualService
2. `/api/main` 경로 → `main-backend-stable` 서비스로 라우팅
3. `main-backend-stable` 서비스 → Argo Rollouts가 관리하는 Pod (stable/preview)
4. Argo Rollouts의 VirtualService가 서브셋(subset) 레벨에서 트래픽 제어

---

## 📝 체크리스트

### 통합 전 확인
- [ ] 기존 VirtualService의 main-backend 라우팅 경로 확인
- [ ] Rollout의 Service 이름 확인 (`main-backend-stable`)
- [ ] Rollout의 Service 포트 확인 (3000)
- [ ] Gateway 이름 확인 (`alphacar-gateway`)

### 통합 작업
- [ ] 기존 VirtualService 수정 (host, port 변경)
- [ ] Rollout 배포
- [ ] Argo Rollouts VirtualService 자동 생성 확인
- [ ] 트래픽 라우팅 테스트

### 통합 후 확인
- [ ] 기존 경로(`/api/main`) 정상 작동 확인
- [ ] Blue-Green 전환 테스트
- [ ] 트래픽 분할 확인

---

## 🎬 영상 촬영 시나리오

### 통합 과정 시연

1. **기존 VirtualService 확인**
   ```bash
   kubectl get virtualservice alphacar-routing -n apc-fe-ns -o yaml
   ```

2. **기존 VirtualService 수정**
   - `main-backend` → `main-backend-stable`
   - 포트 `3002` → `3000`

3. **Rollout 배포**
   ```bash
   kubectl apply -f main-backend-rollout-bluegreen.yaml
   ```

4. **Argo Rollouts VirtualService 자동 생성 확인**
   ```bash
   kubectl get virtualservice main-backend-vs -n apc-be-ns
   ```

5. **통합 테스트**
   - 기존 경로로 접근 테스트
   - Blue-Green 전환 테스트

---

## 💡 핵심 포인트

1. **기존 VirtualService 수정 필요**
   - `main-backend` → `main-backend-stable`
   - 포트 `3002` → `3000`

2. **Argo Rollouts VirtualService는 자동 생성**
   - 수동 생성/수정 불필요
   - Blue-Green 전환 시 자동 업데이트

3. **두 VirtualService가 협력**
   - `alphacar-routing`: 경로 기반 라우팅
   - `main-backend-vs`: 서브셋 기반 트래픽 제어

**→ Istio VirtualService와 완벽하게 통합됩니다!**

