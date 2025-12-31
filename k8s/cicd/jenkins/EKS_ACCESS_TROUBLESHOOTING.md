# EKS 접근 설정 문제 해결 가이드

## 현재 문제 상황

1. ❌ `eksctl: command not found` - eksctl 미설치
2. ❌ `AccessDeniedException: eks:DescribeCluster` - EKS 접근 권한 없음
3. ⚠️ Jenkins EC2 인스턴스에서 실행 중 (배스천 서버가 아님)

## 해결 방법

### 방법 1: 배스천 서버에서 실행 (권장) ⭐

`eksctl create iamidentitymapping` 명령어는 **배스천 서버**에서 실행해야 합니다.

이유:
- 배스천 서버에 `eksctl`이 설치되어 있음
- 배스천 서버의 IAM User (`kimdohun`)가 EKS 클러스터에 접근 권한이 있음
- Jenkins EC2는 빌드/배포 전용, 클러스터 관리용이 아님

**배스천 서버에서 실행:**

```bash
# 1. 배스천 서버에 SSH 접속
ssh kevin@배스천서버IP

# 2. ARN 확인
aws sts get-caller-identity --query Arn --output text
# 출력: arn:aws:iam::382045063773:user/kimdohun

# 3. EKS 클러스터에 IAM User 매핑 (ARN 수정 필요!)
eksctl create iamidentitymapping \
  --cluster apc-eks-cluster \
  --region ap-northeast-2 \
  --arn arn:aws:iam::382045063773:user/kimdohun \
  --group system:masters \
  --username kevin
```

**주의:** 사용자가 보낸 명령어에 ARN이 잘못되었습니다:
- ❌ `arn:aws:iam::382063773:user/kimdohun` (계정 번호 잘못됨)
- ✅ `arn:aws:iam::382045063773:user/kimdohun` (올바른 계정 번호)

### 방법 2: Jenkins EC2에 eksctl 설치 및 권한 추가 (비권장)

Jenkins EC2에서 직접 EKS 접근이 필요한 경우:

#### 2-1. eksctl 설치

```bash
# eksctl 설치
curl -sLO "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz"
tar -xzf eksctl_$(uname -s)_amd64.tar.gz -C /tmp && rm eksctl_$(uname -s)_amd64.tar.gz
sudo mv /tmp/eksctl /usr/local/bin
eksctl version
```

#### 2-2. Jenkins-ECR-Role에 EKS 권한 추가

AWS Console에서:
1. IAM → Roles → `Jenkins-ECR-Role` 선택
2. Add permissions → Attach policies
3. 다음 권한 추가:
   - `AmazonEKSClusterPolicy` (또는 필요한 최소 권한)
   - 또는 직접 정책 생성:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "eks:DescribeCluster",
             "eks:ListClusters"
           ],
           "Resource": "*"
         }
       ]
     }
     ```

#### 2-3. IAM Identity Mapping 생성

```bash
# Jenkins EC2의 IAM Role ARN 사용
eksctl create iamidentitymapping \
  --cluster apc-eks-cluster \
  --region ap-northeast-2 \
  --arn arn:aws:iam::382045063773:role/Jenkins-ECR-Role \
  --group system:masters \
  --username jenkins-ec2
```

**⚠️ 주의:** 이 방법은 보안상 권장되지 않습니다. Jenkins EC2에 `system:masters` 권한을 주는 것은 과도한 권한입니다.

## 권장 접근 방식

### ✅ 올바른 워크플로우:

1. **배스천 서버에서 EKS 접근 설정**
   ```bash
   # 배스천 서버 접속 후
   eksctl create iamidentitymapping \
     --cluster apc-eks-cluster \
     --region ap-northeast-2 \
     --arn arn:aws:iam::382045063773:user/kimdohun \
     --group system:masters \
     --username kevin
   ```

2. **배스천 서버에서 kubeconfig 업데이트 및 확인**
   ```bash
   aws eks update-kubeconfig --name apc-eks-cluster --region ap-northeast-2
   kubectl get nodes
   ```

3. **배스천 서버에서 ArgoCD 설치**
   ```bash
   kubectl create namespace argocd
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   ```

4. **Jenkins는 이미지 빌드/푸시만 담당**
   - ECR에 이미지 푸시 (이미 작동 중 ✅)
   - GitOps 레포지토리에 매니페스트 업데이트 (이미 작동 중 ✅)
   - ArgoCD가 자동으로 배포 감지 및 적용

## 결론

**✅ 배스천 서버에서 명령어를 실행하세요!**

Jenkins EC2에서 실행할 필요가 없습니다. Jenkins는:
- 이미지 빌드 및 ECR 푸시
- GitOps 레포지토리 매니페스트 업데이트

이 두 가지만 담당하면 되고, EKS 클러스터 관리 및 ArgoCD 설치/관리는 배스천 서버에서 처리합니다.

