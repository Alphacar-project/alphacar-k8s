# 배스천 서버에서 EKS 접근 설정 가이드

## 배스천 서버 정보

✅ **인스턴스 ID**: i-0b8645318e72a1434
✅ **퍼블릭 IP**: 52.78.247.52
✅ **프라이빗 IP**: 10.10.0.33
✅ **IAM 역할**: apc-bastion-admin-role
✅ **VPC**: apc-eks-vpc
✅ **상태**: 실행 중

## SSH 접속 방법

### 방법 1: SSH 키 파일 사용 (권장)

```bash
# SSH 키 파일 경로에 맞게 수정
ssh -i ~/.ssh/apc-jenkins.pem ubuntu@52.78.247.52

# 또는 kevin 사용자일 경우
ssh -i ~/.ssh/apc-jenkins.pem kevin@52.78.247.52
```

### 방법 2: AWS Systems Manager Session Manager (키 파일 없이)

```bash
aws ssm start-session --target i-0b8645318e72a1434 --region ap-northeast-2
```

## EKS 접근 설정 단계

### 1단계: 배스천 서버에 SSH 접속

```bash
ssh -i <키파일경로> ubuntu@52.78.247.52
# 또는
ssh -i <키파일경로> kevin@52.78.247.52
```

### 2단계: 현재 ARN 확인

```bash
aws sts get-caller-identity --query Arn --output text
```

**예상 출력:**
```
arn:aws:sts::382045063773:assumed-role/apc-bastion-admin-role/i-0b8645318e72a1434
```

또는 IAM User일 경우:
```
arn:aws:iam::382045063773:user/kimdohun
```

### 3단계: eksctl 설치 확인

```bash
eksctl version
```

**만약 eksctl이 없다면 설치:**

```bash
# eksctl 설치 (Linux)
curl -sLO "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz"
tar -xzf eksctl_$(uname -s)_amd64.tar.gz -C /tmp && rm eksctl_$(uname -s)_amd64.tar.gz
sudo mv /tmp/eksctl /usr/local/bin
eksctl version
```

### 4단계: EKS 클러스터에 IAM Identity Mapping 추가

**IAM User인 경우:**
```bash
eksctl create iamidentitymapping \
  --cluster apc-eks-cluster \
  --region ap-northeast-2 \
  --arn arn:aws:iam::382045063773:user/kimdohun \
  --group system:masters \
  --username kevin
```

**IAM Role인 경우 (apc-bastion-admin-role):**
```bash
eksctl create iamidentitymapping \
  --cluster apc-eks-cluster \
  --region ap-northeast-2 \
  --arn arn:aws:iam::382045063773:role/apc-bastion-admin-role \
  --group system:masters \
  --username bastion-admin
```

### 5단계: kubeconfig 업데이트

```bash
aws eks update-kubeconfig --name apc-eks-cluster --region ap-northeast-2
```

**출력 예시:**
```
Added new context arn:aws:eks:ap-northeast-2:382045063773:cluster/apc-eks-cluster to /home/ubuntu/.kube/config
```

### 6단계: 접근 확인

```bash
# 클러스터 정보 확인
kubectl cluster-info

# 노드 확인
kubectl get nodes

# 모든 네임스페이스 확인
kubectl get namespaces
```

**예상 출력 (노드):**
```
NAME                                            STATUS   ROLES    AGE   VERSION
ip-10-10-2-74.ap-northeast-2.compute.internal  Ready    <none>   XXm   v1.34.1
ip-10-10-4-33.ap-northeast-2.compute.internal  Ready    <none>   XXm   v1.34.1
```

## 다음 단계: ArgoCD 설치

EKS 접근이 확인되면 ArgoCD를 설치할 수 있습니다:

```bash
# ArgoCD 네임스페이스 생성
kubectl create namespace argocd

# ArgoCD 설치
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# ArgoCD Pod 상태 확인
kubectl get pods -n argocd -w

# ArgoCD 서비스 확인
kubectl get svc -n argocd
```

## 문제 해결

### eksctl 명령어를 찾을 수 없는 경우

```bash
# eksctl 설치
curl -sLO "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz"
tar -xzf eksctl_$(uname -s)_amd64.tar.gz -C /tmp && rm eksctl_$(uname -s)_amd64.tar.gz
sudo mv /tmp/eksctl /usr/local/bin
eksctl version
```

### kubectl 명령어를 찾을 수 없는 경우

```bash
# kubectl 설치
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
kubectl version --client
```

### EKS 접근 권한 오류인 경우

IAM 역할 `apc-bastion-admin-role`에 다음 권한이 있는지 확인:
- `eks:DescribeCluster`
- `eks:ListClusters`
- `eks:CreateAccessEntry` (IAM identity mapping을 위해 필요할 수 있음)

## 참고사항

- 배스천 서버의 IAM 역할이 `system:masters` 권한으로 매핑되면 EKS 클러스터에 완전한 관리자 권한을 가지게 됩니다.
- 보안을 위해 필요시 더 제한적인 권한 그룹(`system:authenticated` 등)을 사용할 수 있습니다.

