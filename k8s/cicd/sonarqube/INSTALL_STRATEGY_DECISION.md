# SonarQube 설치 전략 결정 가이드

## 중요한 고려사항

### 현재 상황
- Jenkins: systemd로 설치됨 (EC2에 직접 설치)
- 미래 계획: EKS + ArgoCD 연동 예정
- 다른 팀원: Pod로 서비스 운영
- 기존 k8s 환경: Pod로 사용

## 두 가지 접근법 비교

### 옵션 1: systemd로 설치 (지금 당장 쉽게)

**장점:**
- ✅ 지금 바로 설치 가능
- ✅ 간단하고 빠름
- ✅ Docker/Kubernetes 설치 불필요

**단점:**
- ❌ 나중에 EKS로 마이그레이션 시 재설치 필요
- ❌ ArgoCD와 연동 불가 (GitOps 불가)
- ❌ 다른 서비스들과 일관성 없음 (Pod vs systemd)
- ❌ Kubernetes 리소스 관리 불가
- ❌ 나중에 마이그레이션 작업 필요 (시간/비용)

### 옵션 2: Kubernetes Pod로 설치 (미래 대비)

**장점:**
- ✅ EKS 전환 시 그대로 사용 가능
- ✅ ArgoCD와 자연스럽게 연동 (GitOps)
- ✅ 다른 서비스들과 일관성 유지 (모두 Pod)
- ✅ Kubernetes 리소스로 관리 (Deployment, Service, PVC 등)
- ✅ 나중에 마이그레이션 작업 불필요

**단점:**
- ⚠️ Kubernetes 환경 필요 (현재 EC2에 k8s 없음)
- ⚠️ 설정이 조금 더 복잡
- ⚠️ EC2에 k8s 설치 필요 (또는 EKS 사용)

## 핵심 질문: EC2에 Kubernetes 설치 가능한가?

### 시나리오 A: EC2에 Kubernetes 설치 가능

**추천: Pod로 설치**

```bash
# EC2에 kubeadm, minikube, 또는 k3s 설치
# 그 다음 Pod로 SonarQube 설치
```

**장점:**
- 미래 EKS 전환 시 쉽게 마이그레이션
- ArgoCD 연동 준비 완료
- GitOps 방식으로 관리 가능

### 시나리오 B: Kubernetes 설치 불가 (현재 EC2만 사용)

**선택지:**
1. **임시로 systemd 설치 → 나중에 재설치** (빠르지만 중복 작업)
2. **지금 EKS 환경 준비 → Pod로 설치** (시간 걸리지만 확실함)

## 권장 전략

### 전략 1: 지금 당장 필요하다면 (임시)

```
현재: EC2 systemd로 SonarQube 설치
      → 빠르게 사용
      
나중: EKS 환경 준비되면
      → Pod로 재설치
      → ArgoCD 연동
```

**적용 상황:** 
- 지금 당장 SonarQube가 필요함
- EKS 전환 시기가 불확실함 (몇 달 후 등)

### 전략 2: 미래를 대비한다면 (권장)

```
지금: EC2에 Kubernetes 환경 구축 (k3s, minikube 등)
      → Pod로 SonarQube 설치
      
나중: EKS로 마이그레이션 시
      → YAML 파일만 수정하여 적용
      → ArgoCD 연동 가능
```

**적용 상황:**
- EKS 전환 계획이 명확함
- ArgoCD 사용 예정
- 다른 서비스와 일관성 중요

### 전략 3: 하이브리드 (현실적)

```
현재: EC2에 k3s (경량 Kubernetes) 설치
      → Pod로 SonarQube 설치
      → Jenkins는 systemd 유지 (이미 설치됨)
      
나중: EKS 전환 시
      → SonarQube YAML만 수정하여 적용
      → Jenkins도 Pod로 마이그레이션 고려
```

**장점:**
- 지금 당장 Kubernetes 환경 체험
- 미래 마이그레이션 용이
- Jenkins는 그대로 사용 (변경 최소화)

## EC2에 Kubernetes 설치 옵션

### 옵션 1: k3s (경량, 추천)

```bash
# k3s 설치 (단일 노드)
curl -sfL https://get.k3s.io | sh -

# kubectl 사용
sudo kubectl get nodes
```

**장점:**
- 경량 (약 50MB)
- 빠른 설치
- 단일 노드에 적합

### 옵션 2: minikube

```bash
# minikube 설치 및 시작
minikube start
```

**장점:**
- 개발 환경에 적합
- 설정 간단

**단점:**
- 리소스 사용량 많음 (8GB RAM에 부담)

### 옵션 3: kubeadm (전체 k8s)

**단점:**
- 설정 복잡
- 리소스 많이 사용
- 단일 노드에 과함

## 최종 추천

### 현재 상황 고려 시: **전략 3 (하이브리드)** ⭐

1. **EC2에 k3s 설치** (경량 Kubernetes)
2. **SonarQube를 Pod로 설치**
3. **Jenkins는 systemd 유지** (이미 설치됨, 변경 최소화)

**이유:**
- ✅ 미래 EKS 전환 시 마이그레이션 용이
- ✅ ArgoCD 연동 가능
- ✅ 다른 서비스와 일관성 유지
- ✅ 리소스 효율적 (k3s는 가벼움)
- ✅ Jenkins는 그대로 사용 (변경 최소화)

## 결론

**Pod로 설치하는 것을 권장합니다!**

**이유:**
1. EKS + ArgoCD 전환 계획이 있다면 지금 Pod로 설치하는 것이 나중에 편함
2. 다른 팀원들과 일관성 유지
3. GitOps 방식으로 관리 가능
4. Kubernetes 환경(k3s) 구축은 생각보다 간단

**다만:**
- 지금 당장 필요하고 EKS 전환 시기가 불확실하면 systemd도 괜찮음
- 하지만 나중에 재설치 작업이 필요함

## 질문

1. EKS 전환 예상 시기는? (몇 주? 몇 달?)
2. ArgoCD 사용 확정인가요?
3. 지금 당장 SonarQube가 필요한가요? (긴급한가?)

이 답변에 따라 최종 결정을 내릴 수 있습니다!

