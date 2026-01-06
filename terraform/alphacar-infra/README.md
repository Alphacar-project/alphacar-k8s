# alphacar.cloud Infrastructure as Code

Terraform을 사용한 완전 자동화 인프라 구성

## 🎯 개요

이 프로젝트는 `terraform apply` 한 번 실행으로 모든 AWS 인프라와 Kubernetes 리소스를 구성합니다.

## 📋 포함된 리소스

### AWS 인프라
- 네트워크: VPC, Subnets, Internet Gateway, NAT Gateway, Route Tables
- 보안: Security Groups, IAM Roles, IAM Instance Profiles
- 컴퓨팅: EKS Cluster, Node Groups, EC2 (Bastion, Jenkins)
- 스토리지: ECR Repositories
- 네트워킹: Route 53 (DNS)
- 인증서: ACM Certificates

### Kubernetes 리소스
- Namespaces (10개)

## 🚀 사용 방법

### 1. 사전 준비

```bash
# Terraform 설치 (1.5.0 이상)
terraform version

# AWS CLI 설정 확인
aws sts get-caller-identity

# 작업 디렉토리로 이동
cd /home/ec2-user/alphacar/terraform/alphacar-infra
```

### 2. 변수 설정

```bash
# terraform.tfvars 파일 생성 (예시 파일 복사)
cp terraform.tfvars.example terraform.tfvars

# 필요시 값 수정
vi terraform.tfvars
```

### 3. Terraform 초기화

```bash
terraform init
```

### 4. 실행 계획 확인

```bash
terraform plan
```

### 5. 인프라 생성

```bash
# 모든 인프라 생성 (약 15분 소요)
terraform apply
```

## ⚠️ 중요 사항

### 기존 인프라와의 관계

**현재 코드는 새로운 인프라를 생성합니다.**

- 기존 AWS 인프라가 이미 존재하는 경우 리소스 이름 충돌 가능
- 새 환경을 생성하려면 변수에서 리소스 이름 변경 필요
- 기존 인프라를 Import하려면 별도 작업 필요

### 리소스 이름 충돌

다음 리소스들은 고유 이름이 필요합니다:
- VPC 이름
- Security Group 이름
- IAM Role 이름
- Route 53 Hosted Zone (도메인)

## 📊 예상 소요 시간

- VPC 및 네트워크: ~2분
- Security Groups: ~30초
- EKS Cluster: ~10분
- EC2 Instances: ~2분
- ECR Repositories: ~1분
- Route 53: ~30초
- Kubernetes Namespaces: ~1분

**총 예상 시간: 약 15분**

## 📁 프로젝트 구조

```
terraform/alphacar-infra/
├── main.tf                    # 모든 모듈 호출
├── provider_kubernetes.tf     # Kubernetes & Helm Provider 설정
├── variables.tf               # 변수 정의
├── outputs.tf                 # 출력값 정의
├── versions.tf                # Provider 버전
├── terraform.tfvars.example   # 변수 예시
├── README.md                  # 이 파일
└── modules/
    ├── network/               # 네트워크 리소스
    ├── security/              # 보안 리소스
    ├── eks/                   # EKS 리소스
    ├── compute/               # EC2 리소스
    ├── ecr/                   # ECR 리소스
    ├── certificates/          # ACM 리소스
    ├── dns/                   # Route 53 리소스
    └── kubernetes/            # Kubernetes 리소스
```

## 🔄 의존성 관계

```
Network → Security → EKS → Kubernetes
                ↓
            Compute (EC2)
                ↓
            ECR, DNS, Certificates
```

## 📝 출력값 확인

```bash
# 모든 출력값 확인
terraform output

# 특정 리소스 확인
terraform state list

# 특정 리소스 정보 확인
terraform state show module.network.aws_vpc.apc_eks_vpc
```

## 🔧 문제 해결

### 오류: 리소스 이름 충돌
- 변수 파일에서 리소스 이름 변경
- 또는 기존 리소스 삭제 (주의!)

### 오류: 권한 부족
- IAM 사용자/역할에 필요한 권한 확인
- Terraform 실행 역할에 다음 권한 필요:
  - EC2, VPC, IAM, EKS, Route 53, ECR, ACM 등

### 오류: AMI ID 찾을 수 없음
- 최신 Amazon Linux 2023 AMI ID 확인
- `aws ec2 describe-images --owners amazon --filters ...` 명령 사용

## 🎉 완료 후

인프라 생성이 완료되면:

1. EKS 클러스터 접속 설정
   ```bash
   aws eks update-kubeconfig --name apc-eks-cluster --region ap-northeast-2
   ```

2. Kubernetes 리소스 배포 (별도)
   - kubectl 또는 Helm 사용
   - 또는 Terraform Kubernetes Provider로 추가 자동화

3. 애플리케이션 배포 (별도)
   - CI/CD 파이프라인에서 처리

## 🧪 코드 테스트 (배포 없이)

운영 중인 서비스가 있어서 실제 배포는 할 수 없는 경우, 다음 방법으로 코드를 테스트할 수 있습니다:

### 안전한 테스트 방법

#### 1. 자동 테스트 스크립트 (권장)

```bash
# 전체 테스트 (문법, 포맷팅, 구조 확인)
./test.sh
```

#### 2. 문법 검증만 (가장 안전)

```bash
# 문법 검증만 수행 (AWS API 호출 없음)
./validate-only.sh

# 또는 수동으로
terraform init
terraform validate
```

#### 3. 코드 포맷팅 확인

```bash
# 포맷팅 상태 확인 (파일 변경 안 함)
terraform fmt -check -recursive
```

### ⚠️ 주의사항

- **terraform plan**: AWS API를 호출하므로 운영 환경에서는 실행하지 않는 것을 권장
- **terraform apply**: 절대 실행하지 마세요! (실제 리소스 생성)

### 테스트 체크리스트

- [ ] `terraform init` 성공
- [ ] `terraform validate` 성공
- [ ] `terraform fmt -check` 통과
- [ ] 모든 모듈이 올바르게 연결됨
- [ ] 변수 정의 완료

## 📍 실행 위치

Terraform은 다음 위치에서 실행할 수 있습니다:

### 옵션 1: 현재 EC2 인스턴스 (빠른 시작)
```bash
# 현재 위치에서 실행
cd /home/ec2-user/alphacar/terraform/alphacar-infra
terraform init
terraform plan
```

### 옵션 2: Jenkins 서버 (자동화)
- CI/CD 파이프라인과 통합
- 자동화된 배포 가능

### 옵션 3: 로컬 개발 머신
- 개발자의 컴퓨터에서 실행
- 빠른 반복 개발

**권장**: 
- **테스트/개발**: 현재 EC2 또는 로컬 머신
- **프로덕션**: Jenkins 서버 또는 CI/CD 파이프라인

자세한 내용은 `WHERE_TO_RUN.md` 참고

## ⚠️ terraform plan 안전성

**terraform plan은 테스트용으로 안전하게 사용 가능합니다!**

### 안전한 이유
- ✅ 리소스 생성 안 함 (읽기 전용)
- ✅ 기존 서비스에 영향 없음
- ✅ 변경사항 미리 확인 가능

### 주의사항
- ⚠️ AWS API를 호출합니다
- ⚠️ 현재 계정에서는 기존 리소스와 충돌 오류 발생 가능
- ✅ 다른 AWS 계정에서는 정상적으로 실행 가능

**결론**: 테스트용으로 사용해도 안전합니다!
