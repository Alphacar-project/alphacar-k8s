# Kubernetes 설치 및 EKS 연결 옵션

## 현재 상황

- EC2 인스턴스: c5a.xlarge (4 vCPU, 8GB RAM)
- Jenkins 백업 완료
- 목표: Kubernetes 설치 후 EKS와 연결

## EKS 연결 옵션 이해

### 옵션 1: EC2에 독립 Kubernetes 클러스터 설치 → EKS로 마이그레이션

**의미:**
- EC2에 kubeadm으로 Kubernetes 클러스터 설치
- 나중에 EKS 클러스터 생성
- YAML 파일만 수정하여 EKS에 배포

**장점:**
- 지금 당장 Kubernetes 환경 구축
- EKS 전환 시 YAML 재사용 가능

**단점:**
- 단일 노드 Kubernetes는 제한적
- EKS 전환 시 재배포 필요

### 옵션 2: EKS 클러스터 생성 → EC2를 노드로 등록 (Managed Node Groups)

**의미:**
- AWS EKS 클러스터 생성
- EC2를 EKS의 Managed Node Group으로 등록
- Pod들이 EKS 클러스터에서 실행

**장점:**
- 진짜 EKS 환경
- AWS 관리형 (고가용성, 자동 업데이트)
- 즉시 EKS 이점 활용

**단점:**
- EKS 클러스터 생성 비용 ($0.10/시간)
- 설정이 더 복잡

### 옵션 3: EKS 클러스터 생성 → EKS 사용 (EC2 없이)

**의미:**
- EKS 클러스터 생성
- EKS의 Managed Node Groups 사용 (별도 EC2 자동 생성)
- 현재 EC2는 Jenkins/SonarQube용으로만 사용

**장점:**
- 완전한 EKS 환경
- AWS가 노드 관리

**단점:**
- 추가 EC2 인스턴스 필요 (비용 증가)
- 현재 EC2 활용 안 됨

## 권장 접근법

### 시나리오 A: 지금 당장 Kubernetes 필요 → 나중에 EKS 전환

**추천: k3s 또는 kubeadm (단일 노드)**

```bash
# k3s (경량, 빠름)
curl -sfL https://get.k3s.io | sh -

# 또는 kubeadm (전체 Kubernetes)
# 설정 복잡하지만 표준 Kubernetes
```

**전환 계획:**
1. EC2에 k3s/kubeadm 설치
2. Jenkins/SonarQube Pod 배포
3. 나중에 EKS 클러스터 생성
4. YAML 파일 수정하여 EKS에 배포

### 시나리오 B: 지금 당장 EKS 환경 구축

**추천: EKS 클러스터 생성**

```bash
# EKS 클러스터 생성 (eksctl 사용)
eksctl create cluster \
  --name alphacar-eks \
  --region ap-northeast-2 \
  --nodegroup-name workers \
  --node-type t3.medium \
  --nodes 1 \
  --nodes-min 1 \
  --nodes-max 3
```

**현재 EC2 활용:**
- EKS 클러스터는 별도로 생성
- 현재 EC2는 그대로 사용하거나 EKS 노드로 전환

## 사용자 의도 파악 필요

### 질문 1: "EKS와 연결"의 의미는?

1. **EC2에 Kubernetes 설치 → 나중에 EKS로 마이그레이션?**
   - 답: k3s 또는 kubeadm 설치

2. **EC2를 EKS 클러스터의 노드로 등록?**
   - 답: EKS 클러스터 생성 후 EC2를 노드로 추가

3. **EKS 클러스터를 생성하고 별도로 운영?**
   - 답: EKS 클러스터 생성 (현재 EC2와 분리)

### 질문 2: 현재 EC2 활용 계획은?

1. **현재 EC2에 Kubernetes 설치해서 사용?**
   - k3s/kubeadm 설치

2. **EKS 클러스터를 새로 만들고 현재 EC2는 별도 용도?**
   - EKS 클러스터 생성

## 각 옵션별 설치 가이드

### 옵션 1: k3s 설치 (가장 간단)

```bash
curl -sfL https://get.k3s.io | sh -
sudo k3s kubectl get nodes
```

### 옵션 2: kubeadm 설치 (표준 Kubernetes)

더 복잡하지만 표준 Kubernetes

### 옵션 3: EKS 클러스터 생성

```bash
# eksctl 설치
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# EKS 클러스터 생성
eksctl create cluster --name alphacar-eks --region ap-northeast-2 --node-type t3.medium --nodes 1
```

## 추천 (명확하지 않을 때)

**임시 해결책: k3s 설치**

이유:
1. 빠르고 간단 (5분 이내)
2. 나중에 EKS 전환 시 YAML 재사용 가능
3. 현재 EC2 활용 가능
4. EKS 전환 시점까지 테스트/개발 가능

**나중에:**
- EKS 클러스터 생성
- YAML 파일 수정하여 EKS에 배포

## 결론

"k8s로 다운로드하고 EKS랑 연결"의 정확한 의미를 확인해야 합니다.

**일단 k3s 설치를 권장**하지만, EKS 클러스터를 지금 바로 만들 계획이면 EKS 생성 방법을 안내해드리겠습니다.

