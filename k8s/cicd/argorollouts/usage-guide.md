# Argo Rollouts + Istio 사용 가이드

## 1. 설치

### Argo Rollouts 설치
```bash
chmod +x install-argo-rollouts.sh
./install-argo-rollouts.sh
```

### Argo Rollouts CLI 설치 (선택사항)
```bash
curl -LO https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64
chmod +x ./kubectl-argo-rollouts-linux-amd64
sudo mv ./kubectl-argo-rollouts-linux-amd64 /usr/local/bin/kubectl-argo-rollouts
```

## 2. 배포 전략 선택

### Canary 배포 (점진적 배포)
- **장점**: 점진적 배포로 위험 최소화
- **사용 시나리오**: 프로덕션 환경, 안정적인 배포가 필요한 경우
- **파일**: `main-backend-rollout.yaml`

### Blue-Green 배포
- **장점**: 빠른 전환, 즉시 롤백 가능
- **사용 시나리오**: 빠른 배포가 필요한 경우, 테스트 환경
- **파일**: `main-backend-rollout-bluegreen.yaml`

## 3. Rollout 배포

### Canary 배포 적용
```bash
kubectl apply -f main-backend-rollout.yaml
```

### Blue-Green 배포 적용
```bash
kubectl apply -f main-backend-rollout-bluegreen.yaml
```

## 4. 배포 모니터링

### Rollout 상태 확인
```bash
# 기본 상태 확인
kubectl get rollout main-backend -n apc-be-ns

# 상세 상태 확인 (CLI 사용)
kubectl argo rollouts get rollout main-backend -n apc-be-ns

# 실시간 상태 확인
kubectl argo rollouts status main-backend -n apc-be-ns --watch
```

### Pod 상태 확인
```bash
kubectl get pods -n apc-be-ns -l app=main-backend
```

### VirtualService 확인
```bash
kubectl get virtualservice main-backend-vs -n apc-be-ns -o yaml
```

## 5. 새 버전 배포

### 이미지 업데이트
```bash
# 방법 1: kubectl set image 사용
kubectl argo rollouts set image main-backend \
  main-backend=192.168.0.170:30000/alphacar/alphacar-main:1.0.33-newversion \
  -n apc-be-ns

# 방법 2: YAML 파일 수정 후 apply
# main-backend-rollout.yaml의 image 필드 수정
kubectl apply -f main-backend-rollout.yaml
```

### 배포 진행 상황 확인
```bash
# Canary 배포의 경우 단계별 진행 상황 확인
kubectl argo rollouts get rollout main-backend -n apc-be-ns

# 트래픽 분할 확인
kubectl get virtualservice main-backend-vs -n apc-be-ns -o yaml
```

## 6. 배포 제어

### 배포 일시 중지
```bash
kubectl argo rollouts pause main-backend -n apc-be-ns
```

### 배포 재개
```bash
kubectl argo rollouts resume main-backend -n apc-be-ns
```

### 배포 승인 (다음 단계로 진행)
```bash
# Canary: 다음 단계로 진행
kubectl argo rollouts promote main-backend -n apc-be-ns

# Blue-Green: 새 버전으로 전환
kubectl argo rollouts promote main-backend -n apc-be-ns
```

### 배포 롤백
```bash
# 이전 버전으로 롤백
kubectl argo rollouts undo main-backend -n apc-be-ns

# 특정 리비전으로 롤백
kubectl argo rollouts undo main-backend --to-revision=2 -n apc-be-ns
```

## 7. ArgoCD와 통합

### ArgoCD Application 생성
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: main-backend-rollout
  namespace: apc-cicd-ns
spec:
  project: default
  source:
    repoURL: 'https://github.com/Alphacar-project/alphacar-k8s.git'
    targetRevision: main
    path: 'k8s/cicd/argorollouts'
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: apc-be-ns
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## 8. 트러블슈팅

### VirtualService가 생성되지 않는 경우
```bash
# Rollout 상태 확인
kubectl describe rollout main-backend -n apc-be-ns

# 이벤트 확인
kubectl get events -n apc-be-ns --sort-by='.lastTimestamp'
```

### 트래픽이 라우팅되지 않는 경우
```bash
# Gateway 확인
kubectl get gateway alphacar-gateway -n istio-system

# VirtualService 확인
kubectl get virtualservice main-backend-vs -n apc-be-ns -o yaml

# DestinationRule 확인
kubectl get destinationrule main-backend-dr -n apc-be-ns -o yaml

# Pod 라벨 확인
kubectl get pods -n apc-be-ns -l app=main-backend --show-labels
```

### Istio Sidecar가 주입되지 않는 경우
```bash
# Pod의 annotation 확인
kubectl get pod <pod-name> -n apc-be-ns -o yaml | grep sidecar

# 네임스페이스에 Istio injection 활성화 (대안)
kubectl label namespace apc-be-ns istio-injection=enabled
```

## 9. 고급 설정

### Analysis Template (메트릭 기반 자동 승인/롤백)
```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
  namespace: apc-be-ns
spec:
  metrics:
  - name: success-rate
    interval: 30s
    successCondition: result[0] >= 0.95
    failureLimit: 3
    provider:
      prometheus:
        address: http://prometheus:9090
        query: |
          sum(rate(istio_requests_total{reporter="source",destination_service_name="main-backend"}[5m])) 
          / 
          sum(rate(istio_requests_total{reporter="source",destination_service_name="main-backend",response_code!~"5.."}[5m]))
```

## 10. 모범 사례

1. **작은 단계로 시작**: 초기에는 10% → 25% → 50% → 100% 같은 보수적인 단계 사용
2. **대기 시간 설정**: 각 단계마다 충분한 대기 시간을 두어 문제를 조기에 발견
3. **모니터링 강화**: Prometheus, Grafana 등을 활용한 실시간 모니터링
4. **자동 롤백 설정**: Analysis Template을 활용한 메트릭 기반 자동 롤백
5. **테스트 환경에서 먼저 검증**: 프로덕션 배포 전 테스트 환경에서 충분히 검증

