# Kubernetes → AWS EKS 마이그레이션 최종 전략

## 📋 현재 상황

### 현재 인프라 구성
- **오케스트레이션**: Kubernetes (멀티 마스터)
- **서비스 메시**: Istio
- **CI**: Jenkins
- **CD**: Argo CD
- **배포 전략**: Argo Rollouts (Blue-Green)
- **컨테이너 레지스트리**: Harbor (192.168.0.170:30000)
- **코드 저장소**: GitHub (Alphacar-project/alphacar-k8s)

---

## 🎯 마이그레이션 목표

1. **Kubernetes → AWS EKS** 마이그레이션
2. **Jenkins → GitLab CI** 전환 (Self-hosted GitLab on EKS)
3. **Argo CD 유지** (CD는 변경 없음)
4. **Argo Rollouts 유지** (배포 전략 변경 없음)
5. **Spot Instance 70% + On-Demand 30%** 활용으로 **비용 절감 95%**

---

## 🏗️ 최종 아키텍처

### 전체 구성도

```
개발자
  ↓ (Git Push)
Self-hosted GitLab (EKS On-Demand 노드)
  ├─ PostgreSQL (AWS RDS)
  ├─ Redis (AWS ElastiCache)
  └─ Gitaly (Git 저장소)
  ↓ (CI 작업 할당)
GitLab Runner (EKS Spot 노드)
  ↓ (Docker 이미지 빌드 및 Push)
Amazon ECR (컨테이너 레지스트리)
  ↓ (매니페스트 파일 업데이트)
GitLab (매니페스트 Git 저장소)
  ↓ (GitOps Sync)
Argo CD (EKS)
  ↓
Argo Rollouts (Blue-Green 배포)
  ↓
Kubernetes Pods (EKS)
  ├─ Frontend (On-Demand 노드)
  ├─ Backend (On-Demand 노드)
  └─ 개발/배치 작업 (Spot 노드)
  ↓
AWS App Mesh (서비스 메시)
  ↓
Application Load Balancer (ALB)
```

### 노드 그룹 구성

#### On-Demand 노드 그룹 (30%)
- **용도**: 
  - Self-hosted GitLab (Stateful 서비스)
  - 프로덕션 워크로드 (Frontend, Backend 핵심 서비스)
- **인스턴스 타입**: t3.large, t3.xlarge
- **용량**: 최소 3개, 최대 10개
- **비용**: ~$300/월

#### Spot 노드 그룹 (70%)
- **용도**:
  - GitLab Runner (CI 작업 실행)
  - 개발 환경 워크로드
  - 배치 작업
- **인스턴스 타입**: 다양한 타입 (c5.large, m5.large, t3.medium 등)
- **용량**: 최소 0개, 최대 10개
- **Spot 최대 가격**: On-Demand의 90%
- **비용**: ~$105/월 (On-Demand 대비 70% 절감)

---

## 📅 단계별 마이그레이션 계획

### Phase 1: 기반 인프라 구축 (1-2개월)

#### 1.1 VPC 및 네트워킹
- VPC 생성 (10.0.0.0/16)
- Public/Private 서브넷 구성 (각 AZ별)
- Internet Gateway 및 NAT Gateway
- 보안 그룹 설정
- VPC 엔드포인트 (ECR, S3)

#### 1.2 EKS 클러스터 구축
- EKS 클러스터 생성 (Kubernetes 1.28+)
- IAM 역할 및 정책 설정 (IRSA)
- On-Demand 노드 그룹 생성 (30%)
- Spot 노드 그룹 생성 (70%)
- Cluster Autoscaler 설치

---

### Phase 2: 컨테이너 레지스트리 마이그레이션 (2주)

#### 2.1 Harbor → Amazon ECR
- ECR 리포지토리 생성
  - `alphacar/frontend`
  - `alphacar/alphacar-main` (backend)
  - `alphacar/alphacar-mypage`
- 기존 Harbor 이미지 마이그레이션
- ECR 라이프사이클 정책 설정
- ECR 이미지 스캔 활성화

---

### Phase 3: CI 도구 전환 - Jenkins → GitLab CI (4-5주)

#### 3.1 RDS PostgreSQL 및 ElastiCache Redis 생성 (1주)
- **RDS PostgreSQL** 생성 (GitLab 데이터베이스)
  - 인스턴스 타입: db.t3.medium
  - 멀티-AZ 활성화
  - 자동 백업 설정
- **ElastiCache Redis** 생성 (GitLab 캐시)
  - 노드 타입: cache.t3.medium
  - 백업 활성화

#### 3.2 Self-hosted GitLab 설치 (2-3주)
- GitLab Helm Chart 설치 (EKS On-Demand 노드)
- RDS PostgreSQL 연결 설정
- ElastiCache Redis 연결 설정
- Ingress 설정 (ALB 연동)
- SSL 인증서 설정 (Let's Encrypt 또는 ACM)
- 초기 관리자 설정

#### 3.3 GitLab Runner 설치 및 CI 파이프라인 마이그레이션 (2주)
- GitLab Runner Helm Chart 설치 (EKS Spot 노드)
- Jenkinsfile → .gitlab-ci.yml 변환
- ECR 인증 설정
- CI 파이프라인 테스트
- 프로덕션 환경 적용

**주요 변경사항**:
- Harbor → ECR
- Jenkins Groovy → GitLab CI YAML
- GitHub 저장소는 그대로 유지 또는 GitLab으로 마이그레이션

---

### Phase 4: 서비스 메시 및 배포 전략 (3-4주)

#### 4.1 Istio → AWS App Mesh
- AWS App Mesh 컨트롤러 설치
- Virtual Node, Virtual Service 설정
- Envoy 사이드카 주입

**대안**: Istio on EKS 유지 (더 많은 기능, 더 복잡한 관리)

#### 4.2 Argo CD 및 Argo Rollouts 마이그레이션
- Argo CD를 EKS에 배포
- Argo Rollouts를 EKS에 배포
- 매니페스트 파일 업데이트 (ECR 이미지 주소)
- Blue-Green 배포 전략 유지

---

### Phase 5: 데이터베이스 및 스토리지 (4-5주)

#### 5.1 데이터베이스 마이그레이션
- MongoDB → Amazon DocumentDB
- 데이터 마이그레이션
- 연결 문자열 업데이트

#### 5.2 스토리지
- Longhorn → Amazon EBS
- EBS CSI Driver 설치
- StorageClass 설정
- PVC 마이그레이션

---

### Phase 6: 모니터링 및 관찰성 (5-6주)

#### 6.1 모니터링 스택
- Prometheus → Amazon Managed Service for Prometheus
- Grafana → Amazon Managed Grafana
- CloudWatch 통합

#### 6.2 로깅 및 추적
- Loki → Amazon CloudWatch Logs
- Tempo → AWS X-Ray
- Fluent Bit 설치 및 설정

---

### Phase 7: 보안 및 최적화 (6주+)

#### 7.1 보안 강화
- AWS Secrets Manager 통합
- ECR 이미지 스캔 활성화
- Pod Security Standards 적용
- 네트워크 정책 설정

#### 7.2 비용 최적화
- Spot Instance 활용 모니터링
- 리소스 사용량 분석
- Reserved Instance 전략
- Savings Plans 고려

---

## 💰 비용 분석

### 현재 비용 (예상)
- 온프레미스 인프라: **$15,000-30,000/월**

### AWS 마이그레이션 후 비용 (Spot Instance 활용)

| 항목 | 월간 비용 |
|------|----------|
| EKS 컨트롤 플레인 | $73 |
| On-Demand 노드 (30%) | $300 |
| Spot 노드 (70%) | $105 |
| RDS PostgreSQL | $100-150 |
| ElastiCache Redis | $50-80 |
| ECR | $50-100 |
| DocumentDB | $200-500 |
| ALB | $20-30 |
| CloudWatch | $50-100 |
| 기타 | $100-200 |
| **총계** | **$1,048-1,738/월** |

### 비용 절감 효과
- **비용 절감: 약 95%**
- Spot Instance 활용으로 On-Demand 대비 70% 절감

---

## 🔑 주요 결정사항

### 1. GitLab 선택: Self-hosted GitLab on EKS

**선택한 방식**: GitLab.com (SaaS) 대신 **Self-hosted GitLab을 EKS에 설치**

**이유**:
- ✅ 완전한 제어권 및 커스터마이징 가능
- ✅ 무제한 Runner 사용 (GitLab.com 무료 플랜은 400분/월 제한)
- ✅ 학습 가치 최대화 (GitLab 서버 운영, RDS, ElastiCache 경험)
- ✅ 취업 시장 가치 매우 높음 ("Self-hosted GitLab on Kubernetes 구축" 경력)

**구성**:
- GitLab: EKS On-Demand 노드 (Stateful 서비스)
- PostgreSQL: AWS RDS (고가용성)
- Redis: AWS ElastiCache (관리형)
- GitLab Runner: EKS Spot 노드 (비용 절감)

### 2. 노드 그룹 구성: Spot 70% + On-Demand 30%

**On-Demand 노드 (30%)**:
- GitLab (Stateful 서비스)
- 프로덕션 워크로드 (Frontend, Backend)

**Spot 노드 (70%)**:
- GitLab Runner (CI 작업)
- 개발 환경
- 배치 작업

### 3. CI/CD 전략

**CI**: GitLab CI (Self-hosted)
- GitLab Runner on EKS Spot 노드
- ECR에 이미지 빌드 및 Push

**CD**: Argo CD (유지)
- GitOps 방식 유지
- Argo Rollouts (Blue-Green) 유지

### 4. 서비스 메시: AWS App Mesh (또는 Istio on EKS)

**옵션 A**: AWS App Mesh (AWS 네이티브, 간단한 관리)
**옵션 B**: Istio on EKS (더 많은 기능, 더 복잡한 관리)

---

## ⚠️ 주요 리스크 및 완화 방안

### 1. Spot Instance 중단
**리스크**: Spot 인스턴스가 갑자기 종료될 수 있음
**완화 방안**:
- On-Demand 노드에 핵심 워크로드 배치
- Pod Disruption Budget 설정
- Cluster Autoscaler로 자동 복구

### 2. GitLab CI 파이프라인 변환
**리스크**: 기존 Jenkins 파이프라인 변환 과정에서 문제 발생
**완화 방안**:
- 단계적 마이그레이션
- Jenkins와 병행 운영 기간 설정
- 충분한 테스트

### 3. 데이터베이스 마이그레이션
**리스크**: 데이터 손실 또는 다운타임
**완화 방안**:
- 백업 생성
- 점진적 마이그레이션
- 롤백 계획 수립

### 4. Self-hosted GitLab 관리 부담
**리스크**: GitLab 서버 운영 및 관리 필요
**완화 방안**:
- RDS, ElastiCache 사용으로 데이터베이스 관리 부담 감소
- Helm Chart로 자동화
- 모니터링 및 알람 설정

---

## ✅ 마이그레이션 체크리스트 (간소화)

### Phase 1: 기반 인프라
- [ ] VPC 및 서브넷 구성
- [ ] EKS 클러스터 생성
- [ ] On-Demand/Spot 노드 그룹 생성
- [ ] Cluster Autoscaler 설치

### Phase 2: 컨테이너 레지스트리
- [ ] ECR 리포지토리 생성
- [ ] Harbor → ECR 이미지 마이그레이션

### Phase 3: CI 도구 전환
- [ ] RDS PostgreSQL 생성
- [ ] ElastiCache Redis 생성
- [ ] Self-hosted GitLab 설치
- [ ] GitLab Runner 설치 (Spot 노드)
- [ ] CI 파이프라인 변환 및 테스트

### Phase 4: 서비스 메시 및 배포
- [ ] AWS App Mesh 설치 (또는 Istio on EKS)
- [ ] Argo CD/Rollouts 마이그레이션

### Phase 5: 데이터베이스 및 스토리지
- [ ] DocumentDB 생성 및 데이터 마이그레이션
- [ ] EBS StorageClass 설정

### Phase 6: 모니터링
- [ ] Managed Prometheus/Grafana 설정
- [ ] CloudWatch Logs 설정

### Phase 7: 보안 및 최적화
- [ ] Secrets Manager 통합
- [ ] 보안 정책 적용
- [ ] 비용 모니터링

---

## 📊 마이그레이션 타임라인

| Phase | 기간 | 주요 작업 |
|-------|------|----------|
| Phase 1 | 1-2개월 | 기반 인프라 구축 |
| Phase 2 | 2주 | ECR 마이그레이션 |
| Phase 3 | 4-5주 | GitLab CI 전환 |
| Phase 4 | 3-4주 | 서비스 메시 및 배포 전략 |
| Phase 5 | 4-5주 | 데이터베이스 및 스토리지 |
| Phase 6 | 5-6주 | 모니터링 및 관찰성 |
| Phase 7 | 6주+ | 보안 및 최적화 |
| **총 기간** | **약 6-8개월** | |

---

## 🎯 기대 효과

### 비용 절감
- **95% 비용 절감** (Spot Instance 활용)
- 월간 비용: $15,000-30,000 → $1,048-1,738

### 기술적 효과
- AWS 클라우드 인프라 경험
- Self-hosted GitLab on Kubernetes 운영 경험
- Spot Instance 활용 경험
- AWS 관리형 서비스 (RDS, ElastiCache) 경험

### 운영 효과
- 관리형 서비스로 운영 부담 감소
- 자동 스케일링 및 고가용성 확보
- 보안 강화 (AWS 서비스 통합)

---

## 📚 참고 자료

- [Amazon EKS 사용자 가이드](https://docs.aws.amazon.com/eks/)
- [AWS App Mesh](https://docs.aws.amazon.com/app-mesh/)
- [GitLab Helm Chart](https://docs.gitlab.com/charts/)
- [GitLab Runner on Kubernetes](https://docs.gitlab.com/runner/install/kubernetes.html)
- [EKS Spot Instances Best Practices](https://aws.github.io/aws-eks-best-practices/karpenter/)
- [Argo Rollouts Documentation](https://argo-rollouts.readthedocs.io/)

---

## 🤔 논의 필요 사항

1. **GitLab 저장소 전략**
   - GitHub 유지 vs GitLab으로 완전 전환
   - 점진적 마이그레이션 vs 일괄 전환

2. **서비스 메시 선택**
   - AWS App Mesh (간단) vs Istio on EKS (기능 많음)

3. **마이그레이션 우선순위**
   - 단계별 진행 vs 병렬 진행

4. **다운타임 허용 범위**
   - Zero-downtime 마이그레이션 필요 여부

5. **팀원 교육 계획**
   - GitLab CI 사용법 교육
   - AWS 서비스 사용법 교육

