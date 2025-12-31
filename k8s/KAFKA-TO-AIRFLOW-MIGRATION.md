# 🔄 Kafka/Strimzi → Airflow 마이그레이션 분석

## 📋 목차
1. [현재 Kafka 사용 현황 분석](#현재-kafka-사용-현황-분석)
2. [Airflow 전환 타당성 분석](#airflow-전환-타당성-분석)
3. [비용 비교](#비용-비교)
4. [마이그레이션 전략](#마이그레이션-전략)
5. [구현 가이드](#구현-가이드)

---

## 🔍 현재 Kafka 사용 현황 분석

### 현재 구성

| 항목 | 내용 |
|------|------|
| **네임스페이스** | `apc-striming-ns` |
| **Kafka 클러스터** | `kafka-cluster` (Kafka 4.1.1) |
| **Strimzi Operator** | ⚠️ CrashLoopBackOff 상태 (문제 발생) |
| **브로커** | 단일 브로커 (고가용성 없음) |
| **스토리지** | Ephemeral (임시 저장소) |
| **토픽** | 4개 |
| **사용 패턴** | 배치 작업 (스트림 아님) |

### Kafka 토픽

1. **danawa-crawl-specifications** (스펙 데이터)
2. **danawa-crawl-options** (옵션 데이터)
3. **danawa-crawl-images** (이미지 데이터)
4. **danawa-crawl-reviews** (리뷰 데이터)

### 현재 워크플로우

```
┌─────────────────┐
│  CronJob        │  매주 일요일 새벽 2시
│  (Producer)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Kafka Topics   │  버퍼 역할만 수행
│  (4개 토픽)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Consumer       │  Deployment로 실행
│  (크롤링 처리)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MongoDB        │  최종 저장
└─────────────────┘
```

### 문제점

1. **스트림 데이터가 아님**: 실제로는 배치 작업인데 Kafka 사용
2. **Strimzi Operator 문제**: CrashLoopBackOff 상태로 관리 어려움
3. **과도한 복잡성**: 단순 배치 작업에 메시징 큐 불필요
4. **비용 낭비**: Kafka 브로커 + Operator 리소스 사용
5. **고가용성 없음**: 단일 브로커로 장애 시 전체 중단

---

## ✅ Airflow 전환 타당성 분석

### Airflow가 적합한 이유

#### 1. **배치 작업에 최적화**
- ✅ DAG (Directed Acyclic Graph)로 워크플로우 정의
- ✅ 작업 의존성 관리
- ✅ 스케줄링 내장 (Cron 표현식 지원)
- ✅ 재시도 및 실패 처리

#### 2. **단순화**
- ❌ Kafka 브로커 불필요
- ❌ Strimzi Operator 불필요
- ❌ Producer/Consumer 패턴 불필요
- ✅ 단일 워크플로우로 통합

#### 3. **관리 편의성**
- ✅ 웹 UI로 작업 모니터링
- ✅ 로그 확인 용이
- ✅ 작업 실행 이력 관리
- ✅ 알림 기능 내장

#### 4. **비용 절감**
- Kafka 브로커 제거 → 리소스 절감
- Operator 제거 → 리소스 절감
- 단순한 아키텍처 → 운영 부담 감소

---

## 💰 비용 비교

### 현재 (Kafka + Strimzi)

```
Kafka 브로커:
- CPU: 250m-500m
- Memory: 512Mi-1Gi
- 스토리지: Ephemeral
- 월 비용 (EC2): $30-50

Strimzi Operator:
- CPU: 200m
- Memory: 512Mi
- 월 비용 (EC2): $20-30

총 비용: $50-80/월
```

### Airflow로 전환 후

```
Airflow Scheduler:
- CPU: 500m
- Memory: 1Gi
- 월 비용 (EC2): $30-40

Airflow Worker:
- CPU: 500m-1000m (작업량에 따라)
- Memory: 1Gi-2Gi
- 월 비용 (EC2): $30-50

총 비용: $60-90/월
```

### AWS 관리형 서비스 옵션

#### Amazon MWAA (Managed Workflows for Apache Airflow)

```
MWAA 환경:
- Small: $0.49/시간 = $360/월
- Medium: $0.98/시간 = $720/월

비용 증가: $280-640/월
```

**결론**: ❌ **MWAA는 비용이 높음**. EKS 내부에서 Airflow 운영 권장

---

## 🎯 마이그레이션 전략

### Phase 1: Airflow 설치 및 설정 (1주)

#### 1.1 Airflow Helm Chart 설치

```bash
# Helm repository 추가
helm repo add apache-airflow https://airflow.apache.org
helm repo update

# Namespace 생성
kubectl create namespace apc-airflow-ns

# Airflow 설치
helm install airflow apache-airflow/airflow \
  --namespace apc-airflow-ns \
  --set executor=KubernetesExecutor \
  --set defaultAirflowTag=2.8.0 \
  --set postgresql.enabled=true \
  --set redis.enabled=false
```

#### 1.2 DAG 작성

**기존 Kafka 워크플로우**:
```
Producer → Kafka Topics → Consumer → MongoDB
```

**Airflow DAG**:
```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'alphacar',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'danawa_crawler',
    default_args=default_args,
    description='다나와 크롤링 워크플로우',
    schedule_interval='0 2 * * 0',  # 매주 일요일 새벽 2시
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=['crawler', 'danawa'],
)

def crawl_specifications(**context):
    """스펙 데이터 크롤링"""
    # 기존 producer 스크립트 로직
    pass

def crawl_options(**context):
    """옵션 데이터 크롤링"""
    pass

def crawl_images(**context):
    """이미지 데이터 크롤링"""
    pass

def crawl_reviews(**context):
    """리뷰 데이터 크롤링"""
    pass

def save_to_mongodb(**context):
    """MongoDB에 저장"""
    # 기존 consumer 스크립트 로직
    pass

# 작업 정의
crawl_specs = PythonOperator(
    task_id='crawl_specifications',
    python_callable=crawl_specifications,
    dag=dag,
)

crawl_opts = PythonOperator(
    task_id='crawl_options',
    python_callable=crawl_options,
    dag=dag,
)

crawl_imgs = PythonOperator(
    task_id='crawl_images',
    python_callable=crawl_images,
    dag=dag,
)

crawl_revs = PythonOperator(
    task_id='crawl_reviews',
    python_callable=crawl_reviews,
    dag=dag,
)

save_mongo = PythonOperator(
    task_id='save_to_mongodb',
    python_callable=save_to_mongodb,
    dag=dag,
)

# 의존성 설정
[crawl_specs, crawl_opts, crawl_imgs, crawl_revs] >> save_mongo
```

### Phase 2: 코드 마이그레이션 (1주)

#### 2.1 Producer 코드 변환

**기존 (Kafka Producer)**:
```javascript
// crawl-danawa-v4-producer.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKERS]
});

const producer = kafka.producer();
await producer.connect();

// 데이터 크롤링
const data = await crawlData();

// Kafka에 전송
await producer.send({
  topic: 'danawa-crawl-specifications',
  messages: [{ value: JSON.stringify(data) }]
});
```

**변경 후 (Airflow Task)**:
```python
# crawl_specifications.py
def crawl_specifications(**context):
    """스펙 데이터 크롤링"""
    # 크롤링 로직 (기존과 동일)
    data = crawl_data()
    
    # XCom에 저장 (다음 작업으로 전달)
    context['ti'].xcom_push(key='specifications', value=data)
    
    return data
```

#### 2.2 Consumer 코드 변환

**기존 (Kafka Consumer)**:
```javascript
// crawl-danawa-v4-consumer.js
const consumer = kafka.consumer({ groupId: 'crawler-group' });
await consumer.subscribe({ topic: 'danawa-crawl-specifications' });

await consumer.run({
  eachMessage: async ({ message }) => {
    const data = JSON.parse(message.value.toString());
    await saveToMongoDB(data);
  }
});
```

**변경 후 (Airflow Task)**:
```python
# save_to_mongodb.py
def save_to_mongodb(**context):
    """MongoDB에 저장"""
    # XCom에서 데이터 가져오기
    specs = context['ti'].xcom_pull(key='specifications', task_ids='crawl_specifications')
    options = context['ti'].xcom_pull(key='options', task_ids='crawl_options')
    images = context['ti'].xcom_pull(key='images', task_ids='crawl_images')
    reviews = context['ti'].xcom_pull(key='reviews', task_ids='crawl_reviews')
    
    # MongoDB에 저장
    save_to_mongodb({
        'specifications': specs,
        'options': options,
        'images': images,
        'reviews': reviews
    })
```

### Phase 3: 테스트 및 검증 (1주)

1. **개발 환경에서 테스트**
   - DAG 실행 테스트
   - 데이터 정확성 검증
   - 에러 처리 확인

2. **스테이징 환경 배포**
   - Airflow 배포
   - DAG 배포
   - 통합 테스트

3. **프로덕션 전환**
   - Kafka 중단
   - Airflow로 전환
   - 모니터링

---

## 🏗️ 구현 가이드

### 1. Airflow Kubernetes Executor 설정

```yaml
# airflow-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: airflow-config
  namespace: apc-airflow-ns
data:
  airflow.cfg: |
    [core]
    executor = KubernetesExecutor
    dags_folder = /opt/airflow/dags
    load_examples = False
    
    [kubernetes]
    namespace = apc-airflow-ns
    worker_container_repository = apache/airflow
    worker_container_tag = 2.8.0
    
    [smtp]
    smtp_host = smtp.gmail.com
    smtp_starttls = True
    smtp_ssl = False
    smtp_user = your-email@gmail.com
    smtp_password = your-password
    smtp_port = 587
    smtp_mail_from = airflow@alphacar.com
```

### 2. DAG 파일 구조

```
dags/
├── __init__.py
├── danawa_crawler.py          # 메인 DAG
├── tasks/
│   ├── __init__.py
│   ├── crawl_specifications.py
│   ├── crawl_options.py
│   ├── crawl_images.py
│   ├── crawl_reviews.py
│   └── save_to_mongodb.py
└── utils/
    ├── __init__.py
    ├── crawler.py
    └── mongodb.py
```

### 3. Kubernetes Pod Template

```yaml
# pod-template.yaml
apiVersion: v1
kind: Pod
metadata:
  name: airflow-worker-template
spec:
  containers:
  - name: base
    image: apache/airflow:2.8.0
    env:
    - name: MONGODB_URI
      valueFrom:
        secretKeyRef:
          name: mongodb-secret
          key: uri
    resources:
      requests:
        memory: "1Gi"
        cpu: "500m"
      limits:
        memory: "2Gi"
        cpu: "1000m"
```

### 4. Secret 관리

```yaml
# airflow-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: airflow-secrets
  namespace: apc-airflow-ns
type: Opaque
stringData:
  mongodb_uri: "mongodb://user:pass@mongodb:27017/db"
  smtp_password: "your-smtp-password"
```

---

## 📊 비교표

| 항목 | Kafka + Strimzi | Airflow |
|------|----------------|---------|
| **용도** | 스트림 메시징 | 워크플로우 오케스트레이션 |
| **적합성** | ❌ 배치 작업에 과함 | ✅ 배치 작업에 최적 |
| **복잡성** | 높음 (브로커 + Operator) | 낮음 (단일 시스템) |
| **관리** | 어려움 (Operator 문제) | 쉬움 (웹 UI) |
| **비용** | $50-80/월 | $60-90/월 (유사) |
| **모니터링** | Kafka UI 필요 | 웹 UI 내장 |
| **재시도** | 수동 구현 | 자동 지원 |
| **의존성 관리** | 어려움 | DAG로 쉬움 |
| **알림** | 별도 구현 | 내장 지원 |

---

## ✅ 마이그레이션 체크리스트

### 준비 단계
- [ ] Airflow Helm Chart 검토
- [ ] DAG 구조 설계
- [ ] 기존 코드 분석

### 구현 단계
- [ ] Airflow 설치 (Helm)
- [ ] DAG 작성
- [ ] 작업 함수 구현
- [ ] Secret/ConfigMap 설정

### 테스트 단계
- [ ] 개발 환경 테스트
- [ ] 데이터 정확성 검증
- [ ] 에러 처리 확인
- [ ] 알림 테스트

### 전환 단계
- [ ] 스테이징 환경 배포
- [ ] 프로덕션 배포
- [ ] Kafka 중단
- [ ] 모니터링 설정

---

## 🚀 AWS 환경에서의 Airflow

### 옵션 1: EKS 내부에서 Airflow 운영 (권장)

**장점**:
- 비용 효율적 ($60-90/월)
- 완전한 제어
- 커스터마이징 가능

**단점**:
- 관리 부담 (하지만 Kafka보다 쉬움)

### 옵션 2: Amazon MWAA (Managed Workflows)

**장점**:
- 완전 관리형
- 자동 스케일링
- 고가용성

**단점**:
- 비용 높음 ($360-720/월)
- 커스터마이징 제한

**결론**: 스트림 데이터가 없고 배치 작업만 있다면, **EKS 내부에서 Airflow 운영을 권장**합니다.

---

## 📚 참고 자료

- [Apache Airflow 공식 문서](https://airflow.apache.org/)
- [Airflow Helm Chart](https://airflow.apache.org/docs/helm-chart/stable/index.html)
- [Airflow Kubernetes Executor](https://airflow.apache.org/docs/apache-airflow/stable/executor/kubernetes.html)

---

## 💡 결론

### ✅ Airflow 전환 권장

**이유**:
1. **스트림 데이터가 없음**: Kafka는 과도한 선택
2. **배치 작업에 최적**: Airflow가 더 적합
3. **단순화**: 아키텍처 단순화
4. **관리 편의성**: 웹 UI로 쉬운 관리
5. **비용 유사**: 비용 차이 미미하지만 운영 부담 감소

**예상 효과**:
- 리소스 절감: Kafka 브로커 + Operator 제거
- 운영 부담 감소: 단순한 아키텍처
- 개발 생산성 향상: DAG로 워크플로우 관리

---

**작성일**: 2024년
**버전**: 1.0
**담당**: 데이터 및 SecOps

