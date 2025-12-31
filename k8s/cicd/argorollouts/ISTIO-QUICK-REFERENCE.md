# Istio + Argo Rollouts 빠른 참조

## 🎯 핵심 정리

### Argo Rollouts가 자동으로 하는 일
- ✅ **VirtualService 자동 생성/업데이트**
- ✅ Blue-Green 전환 시 트래픽 자동 라우팅
- ✅ 롤백 시 즉시 트래픽 복구

### 수동으로 해야 하는 일
- ✅ **DestinationRule 생성** (서브셋 정의)
- ✅ Gateway 설정 (이미 완료)
- ✅ Service 생성 (Stable, Preview)

---

## 📋 설정 체크리스트

### 1. Gateway ✅ (이미 있음)
```yaml
# k8s/backend/alphacar-gateway.yaml
name: alphacar-gateway
namespace: istio-system
```

### 2. DestinationRule ✅ (Rollout 파일에 포함)
```yaml
# main-backend-rollout-bluegreen.yaml
name: main-backend-dr
subsets: stable, preview
```

### 3. Rollout 설정 ✅ (완료)
```yaml
trafficManagement:
  istio:
    virtualService:
      name: main-backend-vs
      routes: [primary]
    destinationRule:
      name: main-backend-dr
```

### 4. VirtualService ❌ (수동 생성 불필요!)
**Argo Rollouts가 자동 생성합니다!**

---

## 🔍 확인 명령어

```bash
# 1. VirtualService 자동 생성 확인
kubectl get virtualservice main-backend-vs -n apc-be-ns

# 2. 트래픽 라우팅 상태 확인
kubectl get virtualservice main-backend-vs -n apc-be-ns -o yaml

# 3. Rollout 상태 확인
kubectl argo rollouts get rollout main-backend -n apc-be-ns

# 4. DestinationRule 확인
kubectl get destinationrule main-backend-dr -n apc-be-ns -o yaml
```

---

## ⚠️ 주의사항

1. **VirtualService를 수동으로 만들지 마세요!**
   - Argo Rollouts가 자동 관리
   - 충돌 발생 가능

2. **Gateway 이름 일치 확인**
   - Rollout의 VirtualService가 참조하는 Gateway 이름
   - 현재: `alphacar-gateway`

3. **Route 이름 일치 확인**
   - Rollout의 `routes: [primary]`
   - VirtualService의 `http[].name: primary`

---

## 🚀 배포 순서

1. **DestinationRule 배포**
   ```bash
   kubectl apply -f main-backend-rollout-bluegreen.yaml
   # DestinationRule 포함됨
   ```

2. **Rollout 배포**
   ```bash
   # 위와 동일 (이미 포함)
   ```

3. **VirtualService 자동 생성 확인**
   ```bash
   kubectl get virtualservice main-backend-vs -n apc-be-ns
   ```

4. **새 버전 배포 테스트**
   ```bash
   kubectl argo rollouts set image main-backend \
     main-backend=NEW_VERSION -n apc-be-ns
   
   # VirtualService 자동 업데이트 확인
   kubectl get virtualservice main-backend-vs -n apc-be-ns -o yaml
   ```

---

## 💡 요약

| 리소스 | 생성 방법 | 관리 주체 |
|--------|----------|----------|
| Gateway | 수동 | 운영자 |
| DestinationRule | 수동 | 운영자 |
| VirtualService | **자동** | **Argo Rollouts** |
| Rollout | 수동 | 운영자 |

**→ VirtualService만 자동 관리, 나머지는 수동 설정!**

