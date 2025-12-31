# Strimzi Kafka 클러스터 상태

## 현재 상태 (2025-12-23)

### 전체 구성 요소

#### 1. Strimzi Cluster Operator
- **타입**: Deployment
- **이름**: `strimzi-cluster-operator`
- **네임스페이스**: `apc-striming-ns`
- **상태**: Running (1/1 Ready)
- **Pod**: `strimzi-cluster-operator-7496bfbdb7-6594l`
- **재시작 횟수**: 2회
- **운영 시간**: 약 22시간

#### 2. Kafka 클러스터
- **타입**: Kafka Custom Resource (CR)
- **이름**: `kafka-cluster`
- **네임스페이스**: `apc-striming-ns`
- **Kafka 버전**: 4.1.1
- **상태**: NotReady (경고 상태)

**경고 사항:**
- ⚠️ 단일 브로커 노드와 ephemeral storage 사용으로 인해 재시작 또는 롤링 업데이트 시 토픽 메시지 손실 가능
- ⚠️ 단일 컨트롤러 노드와 ephemeral storage 사용으로 인해 재시작 또는 롤링 업데이트 시 데이터 손실 가능
- ⚠️ 활성 컨트롤러 확인 중 오류 발생

#### 3. Kafka NodePool
- **타입**: KafkaNodePool Custom Resource (CR)
- **이름**: `kafka-cluster-pool`
- **네임스페이스**: `apc-striming-ns`
- **Replicas**: 1
- **역할**: broker, controller (단일 노드에서 모두 수행)
- **Storage**: ephemeral (임시 저장소, Pod 재시작 시 데이터 손실)

#### 4. Kafka 브로커 Pod
- **타입**: Pod (StrimziPodSet에 의해 관리)
- **이름**: `kafka-cluster-kafka-cluster-pool-0`
- **네임스페이스**: `apc-striming-ns`
- **상태**: Running (1/1 Ready)
- **재시작 횟수**: 2회
- **운영 시간**: 약 155분
- **노드**: a-worker4
- **IP**: 10.244.82.123

**관리 방식:**
- **StrimziPodSet**으로 관리됨 (StatefulSet이 아님)
- Strimzi Operator가 Pod를 직접 관리

**리소스:**
- **Requests**: CPU 250m, Memory 512Mi
- **Limits**: CPU 500m, Memory 1Gi

**Storage:**
- **Type**: EmptyDir (ephemeral)
- **용도**: Kafka 데이터 저장
- **주의**: Pod 재시작 시 데이터 손실

#### 5. Kafka Services
- **kafka-cluster-kafka-bootstrap** (ClusterIP)
  - 포트: 9091, 9092, 9093
  - 용도: 클라이언트 연결용 부트스트랩 서비스
  - Cluster IP: 10.98.194.181

- **kafka-cluster-kafka-brokers** (Headless Service)
  - 포트: 9090, 9091, 8443, 9092, 9093
  - 용도: 브로커 간 통신용

#### 6. Kafka Topics
다음 4개의 토픽이 생성되어 있음:
- `danawa-crawl-images` (152분 전 생성)
- `danawa-crawl-options` (152분 전 생성)
- `danawa-crawl-reviews` (152분 전 생성)
- `danawa-crawl-specifications` (152분 전 생성)

#### 7. Entity Operators
- **Topic Operator**: 토픽 관리 (Deployment로 실행되지 않음, Operator 내부에서 실행)
- **User Operator**: 사용자 관리 (Deployment로 실행되지 않음, Operator 내부에서 실행)

---

## 배포 방식 요약

### Deployment로 배포된 것
1. ✅ **Strimzi Cluster Operator**: `strimzi-cluster-operator` Deployment
2. ✅ **Crawler**: `crawler` Deployment (Kafka와 별개)

### Pod로 직접 배포된 것 (StrimziPodSet)
1. ✅ **Kafka 브로커**: `kafka-cluster-kafka-cluster-pool-0` Pod
   - StatefulSet이 아님
   - StrimziPodSet으로 관리됨
   - Strimzi Operator가 직접 Pod를 생성 및 관리

### Custom Resource로 정의된 것
1. ✅ **Kafka**: `kafka-cluster` (Kafka CR)
2. ✅ **KafkaNodePool**: `kafka-cluster-pool` (KafkaNodePool CR)
3. ✅ **KafkaTopic**: 4개 토픽 (KafkaTopic CR)

---

## 설정 정보

### Kafka 클러스터 설정
```yaml
Kafka 버전: 4.1.1
Listeners:
  - plain: 9092 (internal, no TLS)
  - tls: 9093 (internal, TLS)
Config:
  - default.replication.factor: 1
  - min.insync.replicas: 1
  - offsets.topic.replication.factor: 1
  - transaction.state.log.replication.factor: 1
  - transaction.state.log.min.isr: 1
```

### NodePool 설정
```yaml
Replicas: 1
Roles: [broker, controller]
Storage: ephemeral
Resources:
  Requests: CPU 250m, Memory 512Mi
  Limits: CPU 500m, Memory 1Gi
```

---

## 접속 정보

### 클라이언트 연결
```bash
# 부트스트랩 서버
kafka-cluster-kafka-bootstrap.apc-striming-ns.svc.cluster.local:9092

# 또는 직접 브로커
kafka-cluster-kafka-brokers.apc-striming-ns.svc.cluster.local:9092
```

### 환경 변수 (Crawler 등에서 사용)
```bash
KAFKA_BROKERS=kafka-cluster-kafka-bootstrap.apc-striming-ns.svc.cluster.local:9092
```

---

## 주의사항

### ⚠️ 데이터 손실 위험
1. **Ephemeral Storage**: Pod 재시작 시 모든 데이터가 손실됩니다
2. **단일 브로커**: 복제본이 없어 브로커 장애 시 데이터 손실 가능
3. **프로덕션 환경**: 현재 설정은 개발/테스트용이며, 프로덕션 환경에서는 다음을 권장:
   - Persistent Volume 사용
   - 최소 3개 브로커 (replication factor 3)
   - 영구 스토리지

### 현재 상태 문제
- **NotReady 상태**: 활성 컨트롤러 확인 중 오류 발생
- Pod는 Running이지만 클러스터 상태가 불안정할 수 있음

---

## 확인 명령어

### 전체 상태 확인
```bash
# Pod 확인
kubectl get pods -n apc-striming-ns

# Kafka 클러스터 확인
kubectl get kafka -n apc-striming-ns

# NodePool 확인
kubectl get kafkanodepool -n apc-striming-ns

# StrimziPodSet 확인
kubectl get strimzipodset -n apc-striming-ns

# Topic 확인
kubectl get kafkatopic -n apc-striming-ns
```

### 상세 정보 확인
```bash
# Kafka 클러스터 상세
kubectl describe kafka kafka-cluster -n apc-striming-ns

# NodePool 상세
kubectl describe kafkanodepool kafka-cluster-pool -n apc-striming-ns

# Pod 상세
kubectl describe pod kafka-cluster-kafka-cluster-pool-0 -n apc-striming-ns
```

### 로그 확인
```bash
# Operator 로그
kubectl logs -n apc-striming-ns deployment/strimzi-cluster-operator

# Kafka 브로커 로그
kubectl logs -n apc-striming-ns kafka-cluster-kafka-cluster-pool-0
```

---

## 리소스 구조

```
apc-striming-ns/
├── Deployment/
│   ├── strimzi-cluster-operator (Operator)
│   └── crawler (애플리케이션)
├── StrimziPodSet/
│   └── kafka-cluster-kafka-cluster-pool (Kafka Pod 관리)
├── Pod/
│   └── kafka-cluster-kafka-cluster-pool-0 (Kafka 브로커)
├── Service/
│   ├── kafka-cluster-kafka-bootstrap (부트스트랩)
│   └── kafka-cluster-kafka-brokers (Headless)
└── Custom Resources/
    ├── Kafka: kafka-cluster
    ├── KafkaNodePool: kafka-cluster-pool
    └── KafkaTopic: 4개
```

---

**최종 업데이트**: 2025-12-23 14:30 UTC


