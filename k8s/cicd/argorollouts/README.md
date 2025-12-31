# Argo Rollouts + Istio 통합 가이드

## 개요

Argo Rollouts와 Istio를 통합하여 Blue-Green 또는 Canary 배포를 수행하는 방법입니다.

## 아키텍처

```
[외부 트래픽] 
    ↓
[Istio Gateway] 
    ↓
[Istio VirtualService] ← 트래픽 분할 제어
    ↓
[Argo Rollouts] ← 배포 전략 관리
    ↓
[Kubernetes Pods]
```

## 핵심 개념

### 1. Argo Rollouts의 Istio 통합
- Argo Rollouts는 Istio의 **VirtualService**를 자동으로 생성/관리합니다
- `trafficManagement` 설정을 통해 Istio와 연동됩니다
- Canary 배포 시 트래픽을 점진적으로 새 버전으로 라우팅합니다

### 2. 필요한 Istio 리소스
- **VirtualService**: 트래픽 라우팅 규칙 정의
- **DestinationRule**: 서브셋(subset) 정의 (stable, canary)

## 설치 방법

### 1. Argo Rollouts 설치

```bash
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```

### 2. Argo Rollouts CLI 설치 (선택사항)

```bash
curl -LO https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64
chmod +x ./kubectl-argo-rollouts-linux-amd64
sudo mv ./kubectl-argo-rollouts-linux-amd64 /usr/local/bin/kubectl-argo-rollouts
```

## Rollout 매니페스트 구조

### 기본 구조

1. **Rollout**: Deployment를 대체하는 리소스
2. **Service**: 기존과 동일 (selector는 Rollout의 podTemplate과 일치)
3. **VirtualService**: Argo Rollouts가 자동 생성 (trafficManagement 설정 시)
4. **DestinationRule**: 서브셋 정의 (수동 생성 필요)

## 배포 전략

### 1. Canary 배포 (점진적 배포)

- 새 버전을 소량 트래픽으로 먼저 배포
- 점진적으로 트래픽 비율 증가
- 문제 발생 시 자동 롤백

### 2. Blue-Green 배포

- 새 버전을 완전히 배포한 후 한 번에 전환
- 빠른 전환, 롤백 용이

## 주의사항

1. **Istio Sidecar Injection**: Rollout의 podTemplate에 `sidecar.istio.io/inject: "true"` 라벨 필요
2. **Service Selector**: Service의 selector가 Rollout의 podTemplate과 일치해야 함
3. **VirtualService 호스트**: Gateway의 호스트와 일치해야 함
4. **DestinationRule 서브셋**: stable, canary 서브셋이 정확히 정의되어야 함

## 트러블슈팅

### VirtualService가 생성되지 않는 경우
- `trafficManagement` 설정 확인
- Istio가 정상 설치되어 있는지 확인
- Rollout의 상태 확인: `kubectl argo rollouts get rollout <rollout-name>`

### 트래픽이 라우팅되지 않는 경우
- Gateway의 호스트와 VirtualService의 호스트 일치 확인
- DestinationRule의 서브셋 이름 확인 (기본값: stable, canary)
- Istio Gateway의 selector 확인

