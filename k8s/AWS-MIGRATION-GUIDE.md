# 🚀 AWS 클라우드 마이그레이션 가이드

## 📋 목차
1. [현재 인프라 분석](#현재-인프라-분석)
2. [AWS 서비스 매핑](#aws-서비스-매핑)
3. [DocumentDB vs MongoDB](#documentdb-vs-mongodb)
4. [마이그레이션 전략](#마이그레이션-전략)
5. [추천 AWS 서비스](#추천-aws-서비스)

---

## 🔍 현재 인프라 분석

### 현재 스택
- **컨테이너 오케스트레이션**: Kubernetes (온프레미스/자체 관리)
- **데이터베이스**:
  - MongoDB (StatefulSet, ReplicaSet) - 메인 DB
  - MariaDB/MySQL - 일부 서비스
  - Redis - 캐싱
- **검색 엔진**: Elasticsearch + Kibana
- **메시징**: Kafka (Strimzi)
- **관찰성**: OpenTelemetry + Alloy Agent
- **백엔드**: NestJS 마이크로서비스 (main, quote, news, aichat, search 등)
- **프론트엔드**: Next.js
- **CI/CD**: Harbor (컨테이너 레지스트리)

---

## 🗺️ AWS 서비스 매핑

### 핵심 인프라

| 현재 구성 | AWS 대체 서비스 | 설명 |
|---------|----------------|------|
| Kubernetes 클러스터 | **Amazon EKS** | 관리형 Kubernetes 서비스 |
| MongoDB (StatefulSet) | **Amazon DocumentDB** | MongoDB 호환 관리형 DB |
| Redis | **Amazon ElastiCache for Redis** | 관리형 Redis 클러스터 |
| MariaDB/MySQL | **Amazon RDS for MariaDB** | 관리형 관계형 DB |
| Elasticsearch | **Amazon OpenSearch Service** | 관리형 검색 서비스 |
| Kafka (Strimzi) | **Amazon MSK (Managed Streaming for Kafka)** | 관리형 Kafka 클러스터 |
| Harbor | **Amazon ECR** | 컨테이너 레지스트리 |
| 로드밸런서 | **AWS Application Load Balancer** | L7 로드밸런서 |
| 스토리지 | **Amazon EBS / EFS** | 블록/파일 스토리지 |

---

## 📊 DocumentDB vs MongoDB

### Amazon DocumentDB란?

**Amazon DocumentDB**는 MongoDB와 호환되는 **완전 관리형 NoSQL 데이터베이스 서비스**입니다.

### 핵심 차이점

| 항목 | MongoDB (현재) | Amazon DocumentDB |
|------|---------------|-------------------|
| **관리 방식** | 자체 관리 (StatefulSet) | 완전 관리형 (AWS) |
| **백업** | 수동 설정 필요 | 자동 백업 (최대 35일) |
| **패치/업데이트** | 수동 적용 | 자동 패치 적용 |
| **모니터링** | 별도 구성 필요 | CloudWatch 통합 |
| **고가용성** | 수동 구성 (ReplicaSet) | 자동 Multi-AZ 복제 |
| **스케일링** | 수동 Pod 확장 | 클릭 한 번으로 스케일링 |
| **코드 변경** | ❌ 필요 없음 | ❌ 필요 없음 (호환) |
| **연결 문자열** | 변경 필요 | MongoDB URI 형식 동일 |

### DocumentDB 사용 시 MongoDB 제거 여부

**✅ 네, MongoDB를 완전히 제거할 수 있습니다!**

1. **코드 변경 최소화**
   - Mongoose 드라이버 그대로 사용 가능
   - 연결 문자열만 변경
   - 쿼리, 스키마 모두 동일

2. **마이그레이션 예시**

```typescript
// 현재 (MongoDB)
MongooseModule.forRootAsync({
  useFactory: async (config: ConfigService) => ({
    uri: `mongodb://${config.get('MONGO_USER')}:${config.get('MONGO_PASS')}@${config.get('MONGO_HOST')}:${config.get('MONGO_PORT')}/${config.get('MONGO_DB_NAME')}?authSource=admin&replicaSet=rs0`,
  }),
})

// AWS DocumentDB로 변경
MongooseModule.forRootAsync({
  useFactory: async (config: ConfigService) => ({
    uri: `mongodb://${config.get('DOCUMENTDB_USER')}:${config.get('DOCUMENTDB_PASS')}@${config.get('DOCUMENTDB_ENDPOINT')}:27017/${config.get('DOCUMENTDB_DB_NAME')}?tls=true&replicaSet=rs0&retryWrites=false`,
  }),
})
```

3. **주의사항**
   - TLS 연결 필수 (`tls=true`)
   - `retryWrites=false` 필수 (DocumentDB 제한)
   - ReplicaSet 이름은 `rs0` 유지 가능

---

## 🎯 마이그레이션 전략

### Phase 1: 핵심 인프라 (1-2주)
1. **EKS 클러스터 생성**
   - VPC, 서브넷 구성
   - 노드 그룹 설정
   - IAM 역할 구성

2. **DocumentDB 클러스터 생성**
   - Subnet Group 생성 (Private Subnet)
   - Security Group 설정
   - 파라미터 그룹 구성
   - 초기 데이터 마이그레이션

3. **ElastiCache Redis 생성**
   - 클러스터 모드 또는 단일 노드
   - VPC 내부 배치

### Phase 2: 데이터 마이그레이션 (1주)
1. **MongoDB → DocumentDB**
   ```bash
   # mongodump로 백업
   mongodump --uri="mongodb://user:pass@mongodb-host:27017/dbname"
   
   # DocumentDB로 복원
   mongorestore --uri="mongodb://user:pass@docdb-endpoint:27017/dbname?tls=true" --ssl
   ```

2. **Redis 데이터 마이그레이션**
   - RDB 파일 백업/복원
   - 또는 애플리케이션 레벨에서 재동기화

### Phase 3: 애플리케이션 배포 (1주)
1. **EKS에 애플리케이션 배포**
   - 기존 Kubernetes 매니페스트 수정
   - ConfigMap/Secret 업데이트 (DocumentDB 연결 정보)
   - 배포 및 테스트

2. **OpenSearch 마이그레이션**
   - Elasticsearch → OpenSearch 데이터 마이그레이션
   - Monstache 설정 업데이트

### Phase 4: 고급 서비스 통합 (2-3주)
1. **MSK 클러스터 생성**
   - Kafka 토픽 마이그레이션
   - Producer/Consumer 설정 업데이트

2. **관찰성 및 모니터링**
   - CloudWatch 통합
   - X-Ray 분산 추적
   - Prometheus + Grafana (EKS)

---

## 🌟 추천 AWS 서비스 (기깔나는 서비스들)

### 1. **Amazon Bedrock** (이미 사용 중 ✅)
- **용도**: AI/ML 모델 통합
- **현재 사용**: Guardrail, Titan Embedding, Llama3
- **추가 활용**:
  - 이미지 생성 (Stable Diffusion)
  - 음성 합성 (Amazon Polly)
  - 문서 분석 (Textract)

### 2. **Amazon OpenSearch Serverless** ⭐ NEW
- **용도**: 검색 엔진 (Elasticsearch 대체)
- **장점**:
  - 서버리스 (자동 스케일링)
  - 비용 최적화 (사용한 만큼만)
  - 관리 부담 제로
- **현재**: Elasticsearch StatefulSet → OpenSearch Serverless

### 3. **Amazon EventBridge** ⭐ NEW
- **용도**: 이벤트 기반 아키텍처
- **활용 예시**:
  - 크롤러 완료 → SNS 알림
  - 주문 생성 → Lambda 트리거
  - 데이터 변경 → 다른 서비스 알림
- **장점**: Kafka보다 간단한 이벤트 라우팅

### 4. **AWS AppSync** ⭐ NEW
- **용도**: GraphQL API (실시간 구독)
- **활용 예시**:
  - 실시간 차량 정보 업데이트
  - 실시간 채팅 (aichat 서비스)
  - 실시간 알림
- **장점**: WebSocket 자동 관리, 실시간 구독

### 5. **Amazon S3 + CloudFront** ⭐ NEW
- **용도**: 정적 파일 및 이미지 CDN
- **활용 예시**:
  - 차량 이미지 저장 및 배포
  - 프론트엔드 정적 파일 호스팅
  - 글로벌 CDN으로 빠른 로딩
- **비용**: 매우 저렴 (GB당 $0.023)

### 6. **AWS Lambda + Step Functions** ⭐ NEW
- **용도**: 서버리스 워크플로우
- **활용 예시**:
  - 크롤러 작업 오케스트레이션
  - 데이터 처리 파이프라인
  - 주기적 작업 (Cron)
- **장점**: 비용 효율적, 자동 스케일링

### 7. **Amazon Cognito** ⭐ NEW
- **용도**: 사용자 인증 및 권한 관리
- **활용 예시**:
  - JWT 대신 Cognito 토큰 사용
  - 소셜 로그인 (Google, Facebook)
  - MFA (다단계 인증)
- **장점**: 완전 관리형, 보안 강화

### 8. **AWS Secrets Manager** ⭐ NEW
- **용도**: 비밀 정보 관리
- **현재**: Kubernetes Secret → AWS Secrets Manager
- **장점**:
  - 자동 로테이션 (DB 비밀번호 등)
  - 감사 로그
  - IAM 기반 접근 제어

### 9. **Amazon Kinesis Data Streams** ⭐ NEW
- **용도**: 실시간 데이터 스트리밍
- **vs Kafka**:
  - 더 간단한 관리
  - 자동 스케일링
  - 서버리스 옵션 (Kinesis Data Firehose)
- **활용 예시**: 실시간 로그 수집, 실시간 분석

### 10. **AWS X-Ray** ⭐ NEW
- **용도**: 분산 추적 (OpenTelemetry 대체/보완)
- **장점**:
  - 서비스 맵 자동 생성
  - 병목 지점 시각화
  - CloudWatch 통합
- **현재**: OpenTelemetry + Alloy → X-Ray 추가

### 11. **Amazon RDS Proxy** ⭐ NEW
- **용도**: 데이터베이스 연결 풀링
- **장점**:
  - 연결 수 제한 완화
  - 자동 페일오버
  - 보안 강화 (IAM 인증)
- **활용**: RDS MariaDB 연결 최적화

### 12. **AWS WAF + Shield** ⭐ NEW
- **용도**: 웹 애플리케이션 보안
- **기능**:
  - DDoS 공격 방어
  - SQL Injection 방어
  - Rate Limiting
  - Bot 차단
- **배치**: ALB 앞단에 배치

### 13. **Amazon SES (Simple Email Service)** ⭐ NEW
- **용도**: 이메일 발송
- **활용 예시**:
  - 견적서 이메일 발송
  - 알림 이메일
  - 마케팅 이메일
- **장점**: 저렴한 비용, 높은 전달률

### 14. **AWS Systems Manager Parameter Store** ⭐ NEW
- **용도**: 설정 관리
- **vs ConfigMap**:
  - 버전 관리
  - 암호화 지원
  - 중앙 집중식 관리
- **활용**: 환경 변수, 설정 값 관리

### 15. **Amazon EFS (Elastic File System)** ⭐ NEW
- **용도**: 공유 파일 스토리지
- **활용 예시**:
  - 여러 Pod 간 파일 공유
  - 로그 파일 수집
  - 임시 파일 저장
- **장점**: NFS 기반, 자동 스케일링

---

## 💰 비용 최적화 팁

### 1. **Reserved Instances / Savings Plans**
- EKS 노드: 1년 약정 시 최대 72% 할인
- RDS/DocumentDB: Reserved Instances로 최대 60% 할인

### 2. **Spot Instances**
- EKS 워커 노드에 Spot 사용 (최대 90% 할인)
- 단, 중요한 워크로드는 On-Demand 유지

### 3. **Auto Scaling**
- EKS HPA (Horizontal Pod Autoscaler)
- EKS Cluster Autoscaler
- DocumentDB 읽기 전용 복제본 자동 스케일링

### 4. **S3 Intelligent-Tiering**
- 자동으로 최적 스토리지 티어로 이동
- 장기 보관 데이터 비용 절감

---

## 🔒 보안 강화

### 1. **VPC 구성**
- Public Subnet: ALB, NAT Gateway
- Private Subnet: EKS, DocumentDB, ElastiCache
- Isolated Subnet: RDS (선택적)

### 2. **Security Groups**
- 최소 권한 원칙
- 포트별 세분화된 접근 제어

### 3. **IAM 역할**
- Pod 레벨 IAM 역할 (IRSA)
- 서비스별 최소 권한

### 4. **암호화**
- 전송 중 암호화 (TLS)
- 저장 시 암호화 (KMS)

---

## 📈 모니터링 및 관찰성

### CloudWatch 통합
- **메트릭**: CPU, 메모리, 네트워크, 디스크
- **로그**: CloudWatch Logs (EKS Pod 로그)
- **알람**: SNS를 통한 알림

### X-Ray 분산 추적
- 서비스 간 호출 추적
- 병목 지점 식별
- 에러 분석

### Prometheus + Grafana (선택)
- EKS에 Prometheus Operator 설치
- 커스텀 메트릭 수집
- Grafana 대시보드

---

## 🚀 마이그레이션 체크리스트

### 준비 단계
- [ ] AWS 계정 생성 및 IAM 설정
- [ ] VPC 및 네트워크 설계
- [ ] 비용 예상 및 예산 확보
- [ ] 마이그레이션 계획 수립

### 인프라 구축
- [ ] EKS 클러스터 생성
- [ ] DocumentDB 클러스터 생성
- [ ] ElastiCache Redis 생성
- [ ] OpenSearch Service 생성
- [ ] MSK 클러스터 생성 (선택)

### 데이터 마이그레이션
- [ ] MongoDB → DocumentDB 데이터 마이그레이션
- [ ] Redis 데이터 마이그레이션
- [ ] Elasticsearch → OpenSearch 마이그레이션

### 애플리케이션 배포
- [ ] EKS에 애플리케이션 배포
- [ ] 연결 문자열 업데이트
- [ ] 테스트 및 검증

### 최적화
- [ ] Auto Scaling 설정
- [ ] 모니터링 및 알람 설정
- [ ] 보안 강화
- [ ] 비용 최적화

---

## 📚 참고 자료

- [Amazon EKS 사용자 가이드](https://docs.aws.amazon.com/eks/)
- [Amazon DocumentDB 사용자 가이드](https://docs.aws.amazon.com/documentdb/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS 마이그레이션 가이드](https://aws.amazon.com/migration/)

---

## ❓ FAQ

### Q1: DocumentDB를 사용하면 MongoDB를 완전히 제거할 수 있나요?
**A**: 네, 가능합니다. DocumentDB는 MongoDB와 호환되므로 코드 변경 없이 연결 문자열만 변경하면 됩니다.

### Q2: 마이그레이션 중 다운타임이 발생하나요?
**A**: Blue-Green 배포 전략을 사용하면 다운타임을 최소화할 수 있습니다. 데이터를 먼저 마이그레이션하고, 애플리케이션을 점진적으로 전환합니다.

### Q3: 비용이 얼마나 드나요?
**A**: 사용량에 따라 다르지만, 일반적으로:
- EKS: 월 $73 (클러스터) + 노드 비용
- DocumentDB: 인스턴스 크기에 따라 다름 (db.t3.medium 기준 약 $100/월)
- ElastiCache: 인스턴스 크기에 따라 다름

### Q4: 기존 Kubernetes 매니페스트를 그대로 사용할 수 있나요?
**A**: 대부분 그대로 사용 가능합니다. 다만 ConfigMap/Secret의 연결 정보만 AWS 서비스 엔드포인트로 변경해야 합니다.

---

**작성일**: 2024년
**버전**: 1.0
