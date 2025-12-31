# 🔄 AWS 마이그레이션 기술 대체 가이드

## 📋 목차
1. [기술 대체 요약표](#기술-대체-요약표)
2. [상세 대체 이유 및 전략](#상세-대체-이유-및-전략)
3. [비용 분석](#비용-분석)
4. [마이그레이션 우선순위](#마이그레이션-우선순위)

---

## 🎯 기술 대체 요약표

| 현재 기술 | 대체 기술 | 대체 여부 | 주요 이유 | 비용 효과 |
|----------|----------|----------|----------|----------|
| **MongoDB (StatefulSet)** | **Amazon DocumentDB** | ✅ **대체** | 자동 백업/패치, 고가용성, 운영 부담 감소 | 하드웨어 교체 시: 74% 절감 |
| **Redis (Deployment)** | **Amazon ElastiCache** | ✅ **대체** | 자동 페일오버, 백업, 모니터링 | 64% 절감 |
| **Elasticsearch (StatefulSet)** | **Amazon OpenSearch Service** | ✅ **대체** | 관리형 서비스, 운영 부담 감소 | 비용 유사, 운영 효율성 향상 |
| **Kafka + Strimzi** | **Apache Airflow** | ✅ **대체** | 스트림 데이터 없음, 배치 작업에 최적 | 비용 유사, 아키텍처 단순화 |
| **Harbor** | **Amazon ECR** | ✅ **대체** | 비용 절감, AWS 통합 | 82% 절감 |
| **Sealed Secret** | **AWS Secrets Manager** | ✅ **대체** | 자동 로테이션, 감사 로그 | 71% 절감 |
| **Alloy Agent** | **CloudWatch Agent** | ✅ **대체** | 무료, AWS 통합 | 100% 절감 |
| **Prometheus** | **Managed Prometheus** | ❌ **유지** | 비용 2배 이상 증가 | EKS 내부 유지 권장 |
| **Grafana** | **Managed Grafana** | ❌ **유지** | 비용 6-10배 증가 | EKS 내부 유지 권장 |
| **Loki** | **CloudWatch Logs** | ⚠️ **조건부** | 로그량에 따라 결정 | 로그량 적으면 55% 절감 |
| **Tempo** | **AWS X-Ray** | ⚠️ **조건부** | 트레이스량에 따라 결정 | 트레이스량 적으면 57-78% 절감 |
| **Istio** | **AWS App Mesh** | ⚠️ **조건부** | Istio가 더 성숙, App Mesh는 AWS 통합 | 비용 유사 |
| **Kyverno** | **OPA Gatekeeper** | ❌ **유지** | Kyverno가 더 사용하기 쉬움 | 변경 불필요 |
| **Longhorn** | **Amazon EBS** | ✅ **대체** | 완전 관리형, 자동 스냅샷, Multi-AZ | 비용 유사, 관리 부담 감소 |
| **Velero** | **Velero + AWS S3** | ✅ **유지** | Kubernetes 리소스 백업에 최적, S3 연동 | 75% 절감 (Pod로 실행) |

---

## 📊 상세 대체 이유 및 전략

### 1. MongoDB → Amazon DocumentDB

#### ✅ 대체 권장

**현재 구성**:
- StatefulSet (3 replicas)
- ReplicaSet 구성
- 수동 백업 및 패치

**대체 이유**:
1. **자동 백업**: 35일 자동 백업 (수동 백업 불필요)
2. **자동 패치**: AWS가 자동으로 패치 적용
3. **고가용성**: Multi-AZ 자동 구성
4. **모니터링**: CloudWatch 통합
5. **코드 변경 없음**: MongoDB와 100% 호환

**비용 분석**:
```
하드웨어 교체 시점:
- 온프레미스: $1,383/월 (하드웨어 포함)
- DocumentDB: $356/월
- 절감: $1,027/월 (74% 절감)

하드웨어 보유 시:
- 온프레미스: $550/월 (운영비만)
- DocumentDB: $356/월
- 절감: $194/월 (35% 절감)
```

**마이그레이션 방법**:
```bash
# 1. DocumentDB 클러스터 생성
aws docdb create-db-cluster \
  --db-cluster-identifier alphacar-docdb \
  --engine docdb \
  --master-username admin \
  --master-user-password SECRET_PASSWORD

# 2. 데이터 마이그레이션
mongodump --uri="mongodb://user:pass@mongodb-host:27017/dbname"
mongorestore --uri="mongodb://user:pass@docdb-endpoint:27017/dbname?tls=true" --ssl

# 3. 연결 문자열 변경
# 기존: mongodb://user:pass@host:27017/db?replicaSet=rs0
# 변경: mongodb://user:pass@docdb-endpoint:27017/db?tls=true&replicaSet=rs0&retryWrites=false
```

**주의사항**:
- TLS 연결 필수 (`tls=true`)
- `retryWrites=false` 필수
- ReplicaSet 이름은 `rs0` 유지 가능

---

### 2. Redis → Amazon ElastiCache

#### ✅ 대체 권장

**현재 구성**:
- Deployment (1 replica)
- 수동 관리

**대체 이유**:
1. **자동 페일오버**: Multi-AZ 구성 시 자동 페일오버
2. **자동 백업**: 스냅샷 자동 생성
3. **모니터링**: CloudWatch 통합
4. **관리 부담 감소**: 운영 시간 75% 절감

**비용 분석**:
```
온프레미스: $110/월 (운영비만)
ElastiCache: $40/월
절감: $70/월 (64% 절감)
```

**마이그레이션 방법**:
```bash
# 1. ElastiCache 클러스터 생성
aws elasticache create-cache-cluster \
  --cache-cluster-id alphacar-redis \
  --cache-node-type cache.t3.small \
  --engine redis \
  --num-cache-nodes 1

# 2. 데이터 마이그레이션 (RDB 파일 또는 애플리케이션 레벨)
redis-cli --rdb dump.rdb
# 또는 애플리케이션에서 재동기화
```

---

### 3. Elasticsearch → Amazon OpenSearch Service

#### ✅ 대체 권장

**현재 구성**:
- StatefulSet (1 replica)
- 수동 관리

**대체 이유**:
1. **관리형 서비스**: 운영 부담 감소
2. **자동 스케일링**: 트래픽에 따라 자동 확장
3. **고가용성**: Multi-AZ 자동 구성
4. **보안**: VPC 내부 배치, IAM 통합

**비용 분석**:
```
온프레미스: $150/월 (운영비만)
OpenSearch: $150/월
비용: 유사하지만 운영 효율성 향상
```

**마이그레이션 방법**:
```bash
# 1. OpenSearch 도메인 생성
aws opensearch create-domain \
  --domain-name alphacar-search \
  --cluster-config InstanceType=t3.small.search,InstanceCount=1

# 2. 데이터 마이그레이션
# Elasticsearch → OpenSearch 데이터 호환
curl -X POST "opensearch-endpoint/_reindex" -H 'Content-Type: application/json' -d'
{
  "source": {
    "remote": {
      "host": "http://elasticsearch-host:9200"
    },
    "index": "vehicles"
  },
  "dest": {
    "index": "vehicles"
  }
}'
```

---

### 4. Kafka + Strimzi → Apache Airflow

#### ✅ 대체 권장

**현재 구성**:
- Kafka 클러스터 (Strimzi Operator)
- 4개 토픽 (danawa-crawl-*)
- Producer/Consumer 패턴

**대체 이유**:
1. **스트림 데이터 없음**: 실제로는 배치 작업 (매주 일요일 새벽 2시)
2. **과도한 복잡성**: 단순 배치 작업에 메시징 큐 불필요
3. **Strimzi Operator 문제**: CrashLoopBackOff 상태
4. **아키텍처 단순화**: DAG로 워크플로우 관리
5. **관리 편의성**: 웹 UI로 작업 모니터링

**비용 분석**:
```
Kafka + Strimzi: $50-80/월
Airflow: $60-90/월
비용: 유사하지만 운영 부담 감소
```

**마이그레이션 방법**:
```python
# 기존: Producer → Kafka Topics → Consumer
# 변경: Airflow DAG

from airflow import DAG
from airflow.operators.python import PythonOperator

dag = DAG(
    'danawa_crawler',
    schedule_interval='0 2 * * 0',  # 매주 일요일 새벽 2시
)

# 작업 정의
crawl_specs = PythonOperator(
    task_id='crawl_specifications',
    python_callable=crawl_specifications,
    dag=dag,
)

# 의존성 설정
crawl_specs >> save_to_mongodb
```

**장점**:
- 워크플로우 시각화
- 재시도 및 실패 처리 자동화
- 알림 기능 내장
- 로그 확인 용이

---

### 5. Harbor → Amazon ECR

#### ✅ 대체 권장

**현재 구성**:
- Harbor (192.168.0.170:30000)
- 자체 관리

**대체 이유**:
1. **비용 절감**: 82% 절감
2. **AWS 통합**: EKS와 완벽 통합
3. **관리 부담 감소**: 완전 관리형
4. **보안**: 이미지 스캔 자동화

**비용 분석**:
```
Harbor: $190/월 (인스턴스 + 운영비)
ECR: $35/월 (스토리지만)
절감: $155/월 (82% 절감)
```

**마이그레이션 방법**:
```bash
# 1. ECR 리포지토리 생성
aws ecr create-repository --repository-name alphacar/main-backend

# 2. 이미지 마이그레이션
docker pull 192.168.0.170:30000/alphacar/main-backend:tag
docker tag 192.168.0.170:30000/alphacar/main-backend:tag \
  ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com/alphacar/main-backend:tag
docker push ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com/alphacar/main-backend:tag

# 3. GitLab CI/CD 업데이트
# .gitlab-ci.yml
build:
  script:
    - aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
    - docker build -t $ECR_REGISTRY/alphacar/main-backend:$CI_COMMIT_SHA .
    - docker push $ECR_REGISTRY/alphacar/main-backend:$CI_COMMIT_SHA
```

---

### 6. Sealed Secret → AWS Secrets Manager

#### ✅ 대체 권장

**현재 구성**:
- Sealed Secret (Kubernetes)
- 수동 로테이션

**대체 이유**:
1. **자동 로테이션**: DB 비밀번호 자동 로테이션
2. **감사 로그**: 모든 접근 기록
3. **IAM 통합**: 세밀한 접근 제어
4. **비용 절감**: 71% 절감

**비용 분석**:
```
Sealed Secret: $100/월 (관리 시간)
Secrets Manager: $29/월 (10개 secret 기준)
절감: $71/월 (71% 절감)
```

**마이그레이션 방법**:
```bash
# 1. Secret 생성
aws secretsmanager create-secret \
  --name alphacar/mongodb-password \
  --secret-string "new-password"

# 2. Kubernetes Secret과 연동
# External Secrets Operator 사용
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: mongodb-secret
spec:
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: mongodb-secret
    creationPolicy: Owner
  data:
  - secretKey: password
    remoteRef:
      key: alphacar/mongodb-password
```

---

### 7. Alloy Agent → CloudWatch Agent

#### ✅ 대체 권장

**현재 구성**:
- Grafana Alloy (DaemonSet)
- Prometheus Remote Write

**대체 이유**:
1. **무료**: CloudWatch Agent 무료
2. **AWS 통합**: CloudWatch 완벽 통합
3. **기능 유사**: 메트릭 수집 동일

**비용 분석**:
```
Alloy Agent: $20-30/월 (인스턴스)
CloudWatch Agent: $0 (무료)
절감: $20-30/월 (100% 절감)
```

**마이그레이션 방법**:
```bash
# 1. CloudWatch Agent 설치
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml

# 2. ConfigMap 설정
apiVersion: v1
kind: ConfigMap
metadata:
  name: cwagentconfig
data:
  cwagentconfig.json: |
    {
      "metrics": {
        "namespace": "AlphaCar",
        "metrics_collected": {
          "kubernetes": {
            "cluster_name": "alphacar-eks"
          }
        }
      }
    }
```

---

### 8. Prometheus → Managed Prometheus

#### ❌ 유지 권장

**대체하지 않는 이유**:
1. **비용 증가**: 2배 이상 증가 ($270 → $351/월)
2. **커스터마이징**: EKS 내부에서 더 유연
3. **기존 설정 유지**: 현재 설정 그대로 사용 가능

**권장 전략**:
- EKS 내부에서 Prometheus 운영
- CloudWatch와 병행 사용 (선택적)

---

### 9. Grafana → Managed Grafana

#### ❌ 유지 권장

**대체하지 않는 이유**:
1. **비용 증가**: 6-10배 증가 ($165 → $225/월)
2. **커스터마이징**: EKS 내부에서 더 유연
3. **기존 대시보드 유지**: 현재 대시보드 그대로 사용

**권장 전략**:
- EKS 내부에서 Grafana 운영
- CloudWatch 대시보드와 병행 사용 (선택적)

---

### 10. Loki → CloudWatch Logs

#### ⚠️ 조건부 대체

**대체 조건**:
- 로그량이 적으면 (100GB 이하): CloudWatch 권장
- 로그량이 많으면: Loki 유지 권장

**비용 분석**:
```
Loki: $175/월 (100GB 기준)
CloudWatch Logs: $78/월 (100GB 기준)
절감: $97/월 (55% 절감)
```

**결정 기준**:
- 로그량 < 100GB/월: CloudWatch 권장
- 로그량 > 100GB/월: Loki 유지 권장

---

### 11. Tempo → AWS X-Ray

#### ⚠️ 조건부 대체

**대체 조건**:
- 트레이스량이 적으면 (100,000 traces/월 이하): X-Ray 권장
- 커스터마이징 필요하면: Tempo 유지 권장

**비용 분석**:
```
Tempo: $115/월
X-Ray: $25-50/월 (무료 티어 포함)
절감: $65-90/월 (57-78% 절감)
```

**결정 기준**:
- 트레이스량 < 100,000/월: X-Ray 권장
- 커스터마이징 필요: Tempo 유지 권장

---

### 12. Istio → AWS App Mesh

#### ⚠️ 조건부 대체

**대체 조건**:
- AWS 통합이 중요하면: App Mesh 권장
- 더 많은 기능 필요하면: Istio 유지 권장

**비용 분석**:
```
Istio: $0 (소프트웨어)
App Mesh: $0 (소프트웨어)
비용: 유사
```

**결정 기준**:
- AWS 통합 중요: App Mesh 권장
- 기능 우선: Istio 유지 권장

---

## 💰 종합 비용 분석

### 시나리오 1: 하드웨어 교체 시점

```
온프레미스 (3년):
- 하드웨어 구매: $100,000
- 운영 비용: $176,400
- 인건비: $36,000
총: $312,400

AWS (3년):
- 마이그레이션: $15,000
- 클라우드 비용: $67,428
- 인건비: $18,000
총: $100,428

절감: $211,972 (68% 절감)
```

### 시나리오 2: 하드웨어 보유 중

```
온프레미스 (월간):
- 운영 비용: $1,400
- 인건비: $1,000
총: $2,400/월

AWS (월간):
- 클라우드 비용: $1,123
- 인건비: $250
총: $1,373/월

절감: $1,027/월 (43% 절감)
```

---

## 🎯 마이그레이션 우선순위

### Phase 1: 즉시 대체 (비용 절감 효과 큼)
1. **Harbor → ECR** (82% 절감)
2. **Sealed Secret → Secrets Manager** (71% 절감)
3. **Alloy Agent → CloudWatch Agent** (100% 절감)

### Phase 2: 하드웨어 교체 시점에 대체
1. **MongoDB → DocumentDB** (74% 절감)
2. **Redis → ElastiCache** (64% 절감)
3. **Elasticsearch → OpenSearch** (운영 효율성)

### Phase 3: 아키텍처 개선
1. **Kafka → Airflow** (단순화)
2. **Loki → CloudWatch Logs** (조건부)
3. **Tempo → X-Ray** (조건부)

### Phase 4: 스토리지 및 백업
1. **Longhorn → EBS** (완전 관리형)
2. **Velero 유지 + AWS S3** (Kubernetes 리소스 백업)

### Phase 5: 유지
1. **Prometheus** (EKS 내부 유지)
2. **Grafana** (EKS 내부 유지)
3. **Kyverno** (변경 불필요)

---

## 📋 마이그레이션 체크리스트

### 즉시 대체 가능
- [ ] Harbor → ECR
- [ ] Sealed Secret → Secrets Manager
- [ ] Alloy Agent → CloudWatch Agent

### 하드웨어 교체 시점에 대체
- [ ] MongoDB → DocumentDB
- [ ] Redis → ElastiCache
- [ ] Elasticsearch → OpenSearch

### 아키텍처 개선
- [ ] Kafka → Airflow
- [ ] Loki → CloudWatch Logs (조건부)
- [ ] Tempo → X-Ray (조건부)

### 유지
- [ ] Prometheus (EKS 내부)
- [ ] Grafana (EKS 내부)
- [ ] Kyverno

---

## 🔗 관련 문서

- [현실적 비용 분석](./AWS-COST-REALISTIC-ANALYSIS.md)
- [랜딩존 구축 가이드](./AWS-COST-ANALYSIS-AND-LANDING-ZONE.md)
- [Kafka → Airflow 마이그레이션](./KAFKA-TO-AIRFLOW-MIGRATION.md)
- [Longhorn & Velero 마이그레이션](./LONGHORN-VELERO-AWS-MIGRATION.md)
- [AWS 마이그레이션 가이드](./AWS-MIGRATION-GUIDE.md)

---

**작성일**: 2024년
**버전**: 1.0
**담당**: 데이터 및 SecOps

