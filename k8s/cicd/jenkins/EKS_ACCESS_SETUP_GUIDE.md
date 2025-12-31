# EKS 접근 설정 가이드

## 현재 상황 분석

### ✅ 이미 완료된 것:
1. **AWS CLI 설치** - ✅ 완료 (버전 2.32.25)
2. **ECR 접근** - ✅ 완료 (Jenkins-ECR-Role IAM 역할 사용)

### ⚠️ 확인 필요:
1. **EKS 클러스터 접근 권한** - 아직 설정 안 됨

## 중요: ECR 접근과 EKS 접근은 독립적입니다

### ECR 접근 (이미 작동 중):
- **방식**: IAM Role (Jenkins-ECR-Role) → EC2 Instance Profile
- **영향**: EKS 접근 설정과 **무관**하게 계속 작동
- **결론**: **ECR 접근 권한은 없어지지 않습니다!** ✅

### EKS 접근 (새로 설정 필요):
- **목적**: EKS 클러스터 API 서버 접근
- **방식**: IAM Identity Mapping (ConfigMap)
- **필요**: `kubectl`, `eksctl` 명령어 사용

## EKS 접근 설정 방법

### 방법 1: IAM User로 접근 (사용자가 보낸 명령어)

```bash
# 1. ARN 확인 (현재 사용자/역할 확인)
aws sts get-caller-identity --query Arn --output text

# 2. EKS 클러스터에 IAM User 매핑
eksctl create iamidentitymapping \
  --cluster apc-eks-cluster \
  --region ap-northeast-2 \
  --arn arn:aws:iam::382045063773:user/kimdohun \
  --group system:masters \
  --username kevin
```

### 방법 2: IAM Role로 접근 (Jenkins EC2용)

```bash
# 1. EC2 인스턴스의 IAM Role ARN 확인
aws sts get-caller-identity --query Arn --output text
# 출력 예: arn:aws:sts::382045063773:assumed-role/Jenkins-ECR-Role/i-xxxxx

# 2. EKS 클러스터에 IAM Role 매핑
eksctl create iamidentitymapping \
  --cluster apc-eks-cluster \
  --region ap-northeast-2 \
  --arn arn:aws:iam::382045063773:role/Jenkins-ECR-Role \
  --group system:masters \
  --username jenkins-ec2
```

## ArgoCD 설치 전 확인 사항

### ✅ 필수 사항:

1. **EKS 클러스터 접근 가능해야 함**
   ```bash
   kubectl get nodes
   # 또는
   kubectl cluster-info
   ```

2. **kubectl 설치 확인**
   ```bash
   kubectl version --client
   ```

3. **eksctl 설치 확인** (IAM mapping을 위해 필요)
   ```bash
   eksctl version
   ```

### ❓ 언제 IAM Identity Mapping을 해야 하나?

**답변: ArgoCD 설치 전에 해야 합니다.**

이유:
- ArgoCD는 Kubernetes 리소스이므로 EKS 클러스터 접근이 필요
- `kubectl apply`로 ArgoCD를 설치하려면 클러스터 접근 권한이 먼저 필요

## 권장 순서

### 1단계: EKS 접근 설정 (지금)
```bash
# 현재 사용자/역할 확인
aws sts get-caller-identity --query Arn --output text

# EKS 클러스터에 매핑 추가 (관리자 또는 적절한 권한이 있는 사용자가 실행)
eksctl create iamidentitymapping \
  --cluster apc-eks-cluster \
  --region ap-northeast-2 \
  --arn <YOUR_ARN> \
  --group system:masters \
  --username <USERNAME>
```

### 2단계: 접근 확인
```bash
# kubeconfig 업데이트 (eksctl이 자동으로 처리)
aws eks update-kubeconfig --name apc-eks-cluster --region ap-northeast-2

# 노드 확인
kubectl get nodes

# 클러스터 정보 확인
kubectl cluster-info
```

### 3단계: ArgoCD 설치
```bash
# ArgoCD 설치 (EKS 접근 가능한 상태에서)
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

## FAQ

### Q1: ECR 접근 권한이 없어지나요?
**A: 아니요!** ECR 접근은 IAM Role을 통해 EC2 Instance Profile로 작동하므로 EKS 접근 설정과 무관합니다.

### Q2: 언제 IAM Identity Mapping을 해야 하나요?
**A: ArgoCD 설치 전에 해야 합니다.** EKS 클러스터에 접근하려면 먼저 권한이 필요합니다.

### Q3: Jenkins EC2에서도 EKS 접근이 필요한가요?
**A: 필요에 따라 다릅니다.**
- ArgoCD만 사용한다면: Jenkins EC2에서 직접 `kubectl` 사용 불필요
- ArgoCD + Jenkins 직접 배포: Jenkins EC2에서 `kubectl` 사용 필요
- 권장: ArgoCD가 배포를 담당하므로 Jenkins는 이미지만 빌드/푸시

## 결론

1. ✅ **ECR 접근 권한은 없어지지 않습니다!**
2. ✅ **EKS 접근 설정을 먼저 해야 합니다** (ArgoCD 설치 전)
3. ✅ **IAM Identity Mapping 명령어를 실행해도 ECR 접근에는 영향 없습니다**

