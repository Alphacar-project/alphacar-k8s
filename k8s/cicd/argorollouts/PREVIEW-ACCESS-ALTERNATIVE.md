# Preview 접속 대안 방법

## ❌ Port Forward 문제

Service를 통한 Port Forward가 Istio sidecar 때문에 실패할 수 있습니다.

---

## ✅ 대안 방법

### 방법 1: Pod IP 직접 접속 (클러스터 내부)

클러스터 내부에서만 접속 가능:

```bash
# Pod IP 확인
POD_IP=$(kubectl get pod -n apc-fe-ns -l rollouts-pod-template-hash=668976b4cd \
  -o jsonpath='{.items[0].status.podIP}')

echo "Pod IP: $POD_IP"
# 결과: 10.244.82.92
```

**주의**: 클러스터 내부 네트워크에서만 접속 가능합니다.

---

### 방법 2: Service ClusterIP 사용 (클러스터 내부)

```bash
# Service ClusterIP 확인
SVC_IP=$(kubectl get svc -n apc-fe-ns frontend-preview -o jsonpath='{.spec.clusterIP}')

echo "Service IP: $SVC_IP"
# 결과: 10.101.164.250
```

**주의**: 클러스터 내부 네트워크에서만 접속 가능합니다.

---

### 방법 3: Service DNS 사용 (클러스터 내부)

클러스터 내부에서:

```bash
# Service DNS로 접속
curl http://frontend-preview.apc-fe-ns.svc.cluster.local:8000
```

---

### 방법 4: Istio VirtualService 사용 (권장)

VirtualService가 설정되어 있다면:

```bash
# VirtualService 확인
kubectl get vs -n apc-fe-ns

# Gateway를 통한 접속
# 예: https://alphacar.cloud (VirtualService 설정 필요)
```

---

### 방법 5: NodePort 또는 LoadBalancer로 변경

Service 타입을 변경:

```bash
kubectl patch svc -n apc-fe-ns frontend-preview -p '{"spec":{"type":"NodePort"}}'

# NodePort 확인
kubectl get svc -n apc-fe-ns frontend-preview
```

---

## 🎯 실제 사용 가능한 방법

### 옵션 1: 클러스터 내부에서 테스트 Pod 사용

```bash
# 테스트 Pod 실행
kubectl run -n apc-fe-ns --rm -i --tty test-pod \
  --image=curlimages/curl:latest \
  --restart=Never \
  -- curl http://frontend-preview.apc-fe-ns.svc.cluster.local:8000
```

### 옵션 2: Dashboard에서 Promote 후 프로덕션 확인

Preview 접속이 어렵다면:
1. Dashboard에서 Preview 상태 확인
2. 바로 Promote 실행
3. 프로덕션에서 확인

```bash
# Dashboard에서 Promote
# 또는
kubectl-argo-rollouts promote frontend -n apc-fe-ns

# 프로덕션 확인
# https://alphacar.cloud
```

---

## 💡 권장 방법

### 영상 촬영 시:

1. **Dashboard에서 Preview 상태 확인**
   - http://localhost:9003/rollouts/
   - `frontend` Rollout 선택
   - Preview Pod 상태 확인

2. **Promote 실행**
   - Dashboard에서 "Promote" 버튼 클릭
   - 또는 `kubectl-argo-rollouts promote frontend -n apc-fe-ns`

3. **프로덕션에서 확인**
   - https://alphacar.cloud 새로고침
   - "Hello 크리스마스 🎄" 사라짐 확인

---

## 🔧 Port Forward 문제 해결 시도

### 재시도 (다른 방법)

```bash
# 1. 기존 프로세스 완전 종료
pkill -9 -f "port-forward.*frontend-preview"

# 2. 잠시 대기
sleep 2

# 3. Pod 직접 Port Forward 시도
kubectl port-forward -n apc-fe-ns frontend-668976b4cd-88b9v 8082:8000 --address=0.0.0.0
```

---

## ✅ 최종 권장사항

**Port Forward가 안 되면**:
- Dashboard에서 Preview 상태 확인
- 바로 Promote 실행
- 프로덕션에서 최종 확인

이렇게 하면 Blue-Green 배포의 핵심인 **Preview 확인 → Promote → 프로덕션 전환** 과정을 시연할 수 있습니다!

