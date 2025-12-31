# 🚀 AWS 마이그레이션 빠른 참조 가이드

## 💰 비용 분석 요약

### ✅ AWS 관리형 서비스로 대체 권장

| 기술 | 대체 서비스 | 월 절감 | 이유 |
|------|-----------|--------|------|
| **MongoDB** | DocumentDB | $250 | 자동 백업, 패치, 모니터링. 인건비 절감 |
| **Redis** | ElastiCache | $75 | 자동 페일오버, 관리 부담 감소 |
| **Elasticsearch** | OpenSearch | $30 | 관리형 서비스로 운영 부담 감소 |
| **Harbor** | ECR | $155 | 비용 절감 효과 큼 |
| **Sealed Secret** | Secrets Manager | $71 | 자동 로테이션, 감사 로그 |

### ❌ EC2에서 유지 권장

| 기술 | 유지 이유 | 월 절감 |
|------|---------|--------|
| **Prometheus** | Managed Prometheus 비용 2배 이상 | $81 절감 |
| **Grafana** | Managed Grafana 비용 6-10배 | $60 절감 |
| **Kyverno** | OPA Gatekeeper로 변경 불필요 | - |

### ⚠️ 조건부 대체

| 기술 | 대체 서비스 | 조건 |
|------|-----------|------|
| **Kafka** | MSK | 트래픽 많으면 MSK, 적으면 EC2 유지 |
| **Loki** | CloudWatch Logs | 로그량 적으면 CloudWatch, 많으면 Loki 유지 |
| **Tempo** | X-Ray | 트레이스량 적으면 X-Ray, 커스터마이징 필요하면 Tempo 유지 |
| **Alloy** | CloudWatch Agent | CloudWatch Agent 무료, 기능 유사 |

---

## 🏛️ 랜딩존 구조

### 멀티 어카운트 (6개 계정)

```
AWS Organizations (루트)
├── Security Account (보안) - 사용자 담당
│   ├── GuardDuty
│   ├── Security Hub
│   └── Config
├── Shared Services Account (공유) - 김도훈 담당
│   ├── ECR (Harbor 대체)
│   ├── Route53
│   └── GitLab Runner
├── Logging Account (로깅) - 방혁 담당
│   ├── CloudTrail
│   ├── Config
│   └── S3 Logs
├── Dev Account (개발) - 길희정 담당
│   └── EKS Dev
├── Staging Account (스테이징) - 김도훈 담당
│   └── EKS Staging
└── Production Account (운영) - 전체 팀
    └── EKS Production
```

---

## 👥 팀 역할별 책임

| 이름 | 역할 | 주요 책임 |
|------|------|----------|
| **김도훈** | DevOps, 팀장, PM | 전체 아키텍처, 프로젝트 관리, 최종 결정, Shared Services 관리 |
| **길희정** | DevOps, CI/CD | GitLab CI/CD 파이프라인, 인프라 자동화, Dev 환경 관리 |
| **방혁** | FinOps, AiOps | 비용 최적화, AI 서비스 운영, 모니터링, Logging Account 관리 |
| **사용자** | 데이터, SecOps | 데이터 파이프라인, 보안 정책, 랜딩존 구축, Security Account 관리 |

---

## 🔄 변경 사항 요약

### CI/CD
- ❌ Harbor → ✅ **ECR**
- ❌ 기존 CI → ✅ **GitLab CI**

### AI 서비스
- ✅ **기존과 동일** (Bedrock, Guardrail 등)

### 데이터베이스
- ❌ MongoDB (StatefulSet) → ✅ **DocumentDB**
- ❌ Redis (Deployment) → ✅ **ElastiCache Redis**
- ❌ Elasticsearch (StatefulSet) → ✅ **OpenSearch Service**

### 관찰성
- ✅ **Prometheus 유지** (EKS 내부)
- ✅ **Grafana 유지** (EKS 내부)
- ⚠️ **Loki → CloudWatch Logs** (조건부)
- ⚠️ **Tempo → X-Ray** (조건부)
- ✅ **Alloy → CloudWatch Agent**

### 보안
- ✅ **Istio 유지** (또는 App Mesh)
- ✅ **Kyverno 유지**
- ❌ **Sealed Secret → Secrets Manager**

---

## 📊 예상 월 비용 (Production 기준)

### 데이터베이스
- DocumentDB: $300/월
- ElastiCache: $40/월
- OpenSearch: $150/월
- **소계: $490/월**

### 컴퓨팅
- EKS 클러스터: $73/월
- EKS 노드 (t3.medium x 3): $90/월
- **소계: $163/월**

### 관찰성 (EKS 내부)
- Prometheus: $20/월
- Grafana: $15/월
- CloudWatch Logs: $50/월
- X-Ray: $25/월
- **소계: $110/월**

### 네트워크
- ALB: $20/월
- NAT Gateway: $35/월
- 데이터 전송: $30/월
- **소계: $85/월**

### 기타
- ECR: $10/월
- Secrets Manager: $4/월
- S3: $20/월
- **소계: $34/월**

### **총 예상 비용: $882/월**

### 절감 효과
- 기존 EC2 비용: ~$1,200/월
- AWS 마이그레이션 후: ~$882/월
- **절감: $318/월 (26% 절감)**
- **인건비 절감 포함 시: ~$600/월 절감**

---

## 🚀 마이그레이션 우선순위

### Phase 1: 핵심 인프라 (2주)
1. 랜딩존 구축 (Organizations, 계정 생성)
2. VPC 및 네트워크 구성
3. DocumentDB 생성 및 데이터 마이그레이션
4. ElastiCache 생성

### Phase 2: 애플리케이션 (2주)
1. EKS 클러스터 생성
2. 애플리케이션 배포
3. GitLab CI/CD 설정
4. ECR 연동

### Phase 3: 보안 및 최적화 (1주)
1. 보안 정책 적용
2. 모니터링 설정
3. 비용 최적화

---

## 📝 주요 명령어

### DocumentDB 연결 문자열
```
mongodb://admin:PASSWORD@docdb-endpoint:27017/dbname?tls=true&replicaSet=rs0&retryWrites=false
```

### EKS 클러스터 생성
```bash
eksctl create cluster \
  --name alphacar-eks \
  --region ap-northeast-2 \
  --nodegroup-name workers \
  --node-type t3.medium \
  --nodes 3
```

### ECR 이미지 푸시
```bash
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com

docker tag image:tag ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com/repo:tag
docker push ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com/repo:tag
```

---

## 🔗 관련 문서

- [상세 비용 분석 및 랜딩존 가이드](./AWS-COST-ANALYSIS-AND-LANDING-ZONE.md)
- [AWS 마이그레이션 가이드](./AWS-MIGRATION-GUIDE.md)

---

**작성일**: 2024년
**버전**: 1.0
