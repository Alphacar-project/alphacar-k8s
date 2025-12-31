# Argo Rollouts + Istio VirtualService 통합 가이드

## 🎯 핵심 개념

### Argo Rollouts와 Istio의 관계

Argo Rollouts는 **Istio VirtualService를 자동으로 관리**합니다!

```
Argo Rollouts
    ↓ (자동 생성/업데이트)
Istio VirtualService
    ↓ (트래픽 라우팅)
Istio Gateway
    ↓
외부 트래픽
```

---

## 📋 필요한 Istio 리소스

### 1. Gateway (이미 있음)
```yaml
# k8s/backend/alphacar-gateway.yaml
apiVersion: networking.istio.io/v1
kind: Gateway
metadata:
  name: alphacar-gateway
  namespace: istio-system
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - alphacar.cloud
```

### 2. DestinationRule (수동 생성 필요)
```yaml
# 서브셋(subset) 정의
# stable, preview 버전을 구분
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: main-backend-dr
  namespace: apc-be-ns
spec:
  host: main-backend-stable
  subsets:
  - name: stable
    labels:
      app: main-backend
      version: stable
  - name: preview
    labels:
      app: main-backend
      version: preview
```

### 3. VirtualService (Argo Rollouts가 자동 관리!)

**중요**: Argo Rollouts가 `trafficManagement` 설정이 있으면 **자동으로 VirtualService를 생성/업데이트**합니다!

---

## 🔧 설정 방법

### Rollout에 Istio 통합 설정

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: main-backend
spec:
  strategy:
    blueGreen:
      trafficManagement:
        istio:
          virtualService:
            name: main-backend-vs  # VirtualService 이름
            routes:
            - primary  # Gateway의 route 이름
          destinationRule:
            name: main-backend-dr  # DestinationRule 이름
            activeSubsetName: stable
            previewSubsetName: preview
```

### Argo Rollouts가 자동으로 하는 일

1. **VirtualService 생성/업데이트**
   - Blue-Green 전환 시 트래픽 라우팅 자동 변경
   - Preview 버전으로 트래픽 분할 (필요시)

2. **트래픽 제어**
   - Stable → Preview 전환 시 트래픽 자동 라우팅
   - 롤백 시 즉시 Stable로 복구

---

## ⚠️ 주의사항

### 1. VirtualService는 Argo Rollouts가 관리

**수동으로 VirtualService를 만들면 안 됩니다!**

Argo Rollouts가 자동으로 관리하므로:
- ❌ VirtualService를 수동으로 생성하면 충돌 발생
- ✅ DestinationRule만 수동 생성
- ✅ Argo Rollouts가 VirtualService 자동 생성

### 2. Gateway와의 연동

VirtualService의 `gateways` 필드에 Gateway 이름을 지정해야 합니다:

```yaml
# Argo Rollouts가 생성하는 VirtualService (자동)
spec:
  gateways:
  - alphacar-gateway  # Gateway 이름과 일치해야 함
  hosts:
  - main-backend-stable  # Service 이름
```

### 3. Route 이름 일치

Rollout의 `routes` 필드와 Gateway의 route 이름이 일치해야 합니다:

```yaml
# Rollout 설정
trafficManagement:
  istio:
    virtualService:
      routes:
      - primary  # 이 이름이 중요!
```

Gateway에 `primary` route가 정의되어 있어야 합니다. (일반적으로 VirtualService의 `http[].name`과 일치)

---

## 🚀 실제 설정 예시

### 완전한 설정 (현재 파일 기준)

#### 1. Gateway (이미 있음)
```yaml
# k8s/backend/alphacar-gateway.yaml
apiVersion: networking.istio.io/v1
kind: Gateway
metadata:
  name: alphacar-gateway
  namespace: istio-system
```

#### 2. DestinationRule (수동 생성)
```yaml
# main-backend-rollout-bluegreen.yaml에 포함됨
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: main-backend-dr
  namespace: apc-be-ns
spec:
  host: main-backend-stable
  subsets:
  - name: stable
    labels:
      app: main-backend
      version: stable
  - name: preview
    labels:
      app: main-backend
      version: preview
```

#### 3. Rollout (VirtualService 자동 생성)
```yaml
# main-backend-rollout-bluegreen.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  strategy:
    blueGreen:
      trafficManagement:
        istio:
          virtualService:
            name: main-backend-vs
            routes:
            - primary
          destinationRule:
            name: main-backend-dr
            activeSubsetName: stable
            previewSubsetName: preview
```

#### 4. VirtualService (Argo Rollouts가 자동 생성!)
```yaml
# 이 파일은 수동으로 만들지 마세요!
# Argo Rollouts가 자동으로 생성합니다
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: main-backend-vs  # Rollout에서 지정한 이름
  namespace: apc-be-ns
spec:
  hosts:
  - main-backend-stable
  gateways:
  - alphacar-gateway  # Gateway 이름
  http:
  - name: primary  # Route 이름
    route:
    - destination:
        host: main-backend-stable
        subset: stable
      weight: 100
```

---

## 🔍 확인 방법

### 1. VirtualService 자동 생성 확인
```bash
# Rollout 배포 후
kubectl get virtualservice main-backend-vs -n apc-be-ns

# 상세 확인
kubectl get virtualservice main-backend-vs -n apc-be-ns -o yaml
```

### 2. 트래픽 라우팅 확인
```bash
# Rollout 상태 확인
kubectl argo rollouts get rollout main-backend -n apc-be-ns

# VirtualService 트래픽 분할 확인
kubectl get virtualservice main-backend-vs -n apc-be-ns -o yaml | grep -A 10 "route:"
```

### 3. 배포 전환 시 VirtualService 변경 확인
```bash
# 새 버전 배포
kubectl argo rollouts set image main-backend \
  main-backend=NEW_VERSION -n apc-be-ns

# VirtualService가 자동으로 업데이트되는지 확인
watch kubectl get virtualservice main-backend-vs -n apc-be-ns -o yaml
```

---

## 🎬 영상 촬영 시나리오

### 시나리오: Istio 통합 시연

1. **초기 상태 확인**
   ```bash
   kubectl get virtualservice main-backend-vs -n apc-be-ns
   # → Argo Rollouts가 자동 생성한 VirtualService 확인
   ```

2. **새 버전 배포**
   ```bash
   kubectl argo rollouts set image main-backend \
     main-backend=NEW_VERSION -n apc-be-ns
   ```

3. **VirtualService 자동 업데이트 확인**
   ```bash
   kubectl get virtualservice main-backend-vs -n apc-be-ns -o yaml
   # → 트래픽이 Preview로 분할되는지 확인
   ```

4. **Promote (전환)**
   ```bash
   kubectl argo rollouts promote main-backend -n apc-be-ns
   ```

5. **VirtualService 최종 상태 확인**
   ```bash
   kubectl get virtualservice main-backend-vs -n apc-be-ns -o yaml
   # → 트래픽이 Stable로 전환된 것 확인
   ```

---

## 📝 요약

### ✅ 해야 할 일
1. **Gateway 설정** (이미 완료)
2. **DestinationRule 수동 생성** (Rollout 파일에 포함)
3. **Rollout에 trafficManagement 설정** (완료)
4. **VirtualService는 Argo Rollouts가 자동 생성!**

### ❌ 하지 말아야 할 일
1. **VirtualService 수동 생성** (충돌 발생)
2. **VirtualService 수동 수정** (Argo Rollouts가 덮어씀)
3. **Gateway 이름 불일치** (연동 실패)

---

## 🔧 트러블슈팅

### VirtualService가 생성되지 않는 경우

1. **Rollout 상태 확인**
   ```bash
   kubectl describe rollout main-backend -n apc-be-ns
   ```

2. **trafficManagement 설정 확인**
   ```bash
   kubectl get rollout main-backend -n apc-be-ns -o yaml | grep -A 10 trafficManagement
   ```

3. **Istio 설치 확인**
   ```bash
   kubectl get pods -n istio-system
   ```

### 트래픽이 라우팅되지 않는 경우

1. **Gateway 호스트 확인**
   ```bash
   kubectl get gateway alphacar-gateway -n istio-system -o yaml
   ```

2. **VirtualService Gateway 참조 확인**
   ```bash
   kubectl get virtualservice main-backend-vs -n apc-be-ns -o yaml | grep gateways
   ```

3. **DestinationRule 서브셋 확인**
   ```bash
   kubectl get destinationrule main-backend-dr -n apc-be-ns -o yaml
   ```

---

## 💡 핵심 포인트

1. **Argo Rollouts가 VirtualService를 자동 관리**
   - 수동 생성/수정 불필요
   - Blue-Green 전환 시 자동 업데이트

2. **DestinationRule은 수동 생성**
   - 서브셋 정의 필요
   - Rollout과 함께 배포

3. **Gateway는 미리 설정**
   - Istio Gateway 설정 완료
   - VirtualService가 참조

**→ Istio와 완벽하게 통합됩니다!**

