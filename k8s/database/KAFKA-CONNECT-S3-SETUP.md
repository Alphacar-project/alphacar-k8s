# Kafka Connect S3 Sink Connector 설정 가이드

크롤링 데이터가 Kafka를 통해 들어오는 데이터를 S3에 자동으로 적재하는 설정입니다.

## 개요

- **Kafka Connect**: Kafka와 외부 시스템 간 데이터 연동을 위한 프레임워크
- **S3 Sink Connector**: Kafka 토픽의 데이터를 AWS S3에 저장하는 커넥터
- **대상 토픽**: 
  - `danawa-crawl-specifications`
  - `danawa-crawl-options`
  - `danawa-crawl-images`
  - `danawa-crawl-reviews`

## 사전 요구사항

1. **Kafka 클러스터**: Strimzi로 배포된 Kafka 클러스터가 실행 중이어야 합니다.
2. **S3 버킷**: 데이터를 저장할 S3 버킷이 생성되어 있어야 합니다. (기본: `yaml-{ACCOUNT_ID}`)
3. **AWS 자격증명**: `apc-backup-ns` 네임스페이스에 `cloud-credentials` Secret이 있어야 합니다.

## 파일 구조

```
k8s/database/
├── kafka-connect.yaml                    # Kafka Connect 클러스터 정의
├── kafka-connect-aws-secret.yaml         # AWS 자격증명 Secret 템플릿
├── kafka-connector-s3-specifications.yaml # Specifications 토픽용 Connector
├── kafka-connector-s3-options.yaml        # Options 토픽용 Connector
├── kafka-connector-s3-images.yaml         # Images 토픽용 Connector
├── kafka-connector-s3-reviews.yaml        # Reviews 토픽용 Connector
├── kafka-connect-setup.sh                 # 자동 설정 스크립트
└── KAFKA-CONNECT-S3-SETUP.md             # 이 문서
```

## 설정 방법

### 방법 1: 자동 설정 스크립트 사용 (권장)

```bash
cd /home/alphacar/alphacar-final/k8s/database
./kafka-connect-setup.sh
```

스크립트가 다음 작업을 자동으로 수행합니다:
1. AWS 자격증명 Secret 생성
2. Kafka Connect 배포
3. 각 토픽별 Connector 배포
4. 상태 확인

### 방법 2: 수동 설정

#### 1. AWS 자격증명 Secret 생성

기존 Secret에서 자격증명을 추출하여 Kafka Connect용 Secret을 생성합니다:

```bash
# 기존 Secret에서 자격증명 추출
CREDENTIALS=$(kubectl get secret cloud-credentials -n apc-backup-ns -o jsonpath='{.data.cloud}' | base64 -d)
AWS_ACCESS_KEY_ID=$(echo "$CREDENTIALS" | grep -E "^aws_access_key_id" | sed 's/.*= *//' | tr -d ' ' | tr -d '\r')
AWS_SECRET_ACCESS_KEY=$(echo "$CREDENTIALS" | grep -E "^aws_secret_access_key" | sed 's/.*= *//' | tr -d ' ' | tr -d '\r')

# Kafka Connect용 Secret 생성
kubectl create secret generic kafka-connect-aws-credentials \
  --namespace apc-striming-ns \
  --from-literal=aws-access-key-id="$AWS_ACCESS_KEY_ID" \
  --from-literal=aws-secret-access-key="$AWS_SECRET_ACCESS_KEY"
```

#### 2. S3 버킷 확인

```bash
# Account ID 확인 (기본값: 382045063773)
ACCOUNT_ID="${ACCOUNT_ID:-382045063773}"
S3_BUCKET="yaml-${ACCOUNT_ID}"

# 버킷 존재 확인
aws s3 ls "s3://${S3_BUCKET}" || {
  echo "버킷이 없습니다. 생성하세요:"
  echo "./setup-s3-buckets.sh"
}
```

#### 3. Kafka Connect 배포

**주의**: Kafka Connect는 커스텀 플러그인을 포함한 Docker 이미지를 빌드해야 합니다.

**옵션 A: Docker 이미지 자동 빌드 (Strimzi Build 기능 사용)**

Docker 레지스트리 Secret이 필요합니다:

```bash
# Docker 레지스트리 Secret 생성 (예: Harbor)
kubectl create secret docker-registry docker-registry-secret \
  --namespace apc-striming-ns \
  --docker-server=harbor.example.com \
  --docker-username=admin \
  --docker-password=password \
  --docker-email=admin@example.com
```

그 다음 Kafka Connect를 배포:

```bash
kubectl apply -f kafka-connect.yaml
```

**옵션 B: 수동으로 Docker 이미지 빌드**

```bash
# Dockerfile 생성
cat > Dockerfile <<EOF
FROM quay.io/strimzi/kafka:0.40.0-kafka-4.1.1
USER root:root
RUN mkdir -p /opt/kafka/plugins && \\
    cd /opt/kafka/plugins && \\
    curl -L https://d1i4a15mxbxib1.cloudfront.net/api/plugins/confluentinc/kafka-connect-s3/versions/10.7.0/confluentinc-kafka-connect-s3-10.7.0.zip -o s3-connector.zip && \\
    unzip s3-connector.zip && \\
    rm s3-connector.zip
USER 1001
EOF

# 이미지 빌드 및 푸시
docker build -t harbor.example.com/kafka-connect-s3:latest .
docker push harbor.example.com/kafka-connect-s3:latest
```

그 다음 `kafka-connect.yaml`에서 `build` 섹션을 제거하고 `image` 필드를 추가:

```yaml
spec:
  image: harbor.example.com/kafka-connect-s3:latest
  # build 섹션 제거
```

#### 4. Kafka Connect 상태 확인

```bash
# Kafka Connect 상태 확인
kubectl get kafkaconnect -n apc-striming-ns

# Pod 로그 확인
kubectl logs -n apc-striming-ns -l strimzi.io/kind=KafkaConnect -f
```

#### 5. Connector 배포

S3 버킷 이름을 실제 값으로 업데이트:

```bash
# Account ID 설정
ACCOUNT_ID="382045063773"  # 실제 Account ID로 변경

# 버킷 이름 업데이트
sed -i "s/yaml-382045063773/yaml-${ACCOUNT_ID}/g" kafka-connector-s3-*.yaml
```

Connector 배포:

```bash
kubectl apply -f kafka-connector-s3-specifications.yaml
kubectl apply -f kafka-connector-s3-options.yaml
kubectl apply -f kafka-connector-s3-images.yaml
kubectl apply -f kafka-connector-s3-reviews.yaml
```

## 설정 확인

### Connector 상태 확인

```bash
# 모든 Connector 상태 확인
kubectl get kafkaconnector -n apc-striming-ns

# 특정 Connector 상세 정보
kubectl describe kafkaconnector s3-sink-specifications -n apc-striming-ns
```

### S3 데이터 확인

```bash
# S3 버킷의 데이터 확인
aws s3 ls s3://yaml-382045063773/crawler-data/ --recursive

# 특정 토픽 데이터 확인
aws s3 ls s3://yaml-382045063773/crawler-data/danawa-crawl-specifications/ --recursive
```

### 로그 확인

```bash
# Kafka Connect Pod 로그
kubectl logs -n apc-striming-ns -l strimzi.io/kind=KafkaConnect -f

# Connector 작업 로그 (Kafka Connect Pod 내부)
kubectl exec -n apc-striming-ns -it <kafka-connect-pod-name> -- \
  curl -s http://localhost:8083/connectors/s3-sink-specifications/status | jq
```

## Connector 설정 설명

### 주요 설정 항목

- **topics**: 소스 Kafka 토픽 이름
- **s3.bucket.name**: 대상 S3 버킷 이름
- **s3.region**: S3 리전
- **flush.size**: S3에 쓰기 전에 메모리에 버퍼링할 레코드 수 (기본: 1000)
- **rotate.interval.ms**: 파일 회전 간격 (기본: 1시간)
- **partition.duration.ms**: 파티션 기간 (기본: 1시간)
- **path.format**: S3 경로 형식 (예: YYYY/MM/dd/HH)
- **format.class**: 파일 형식 (JSON, Avro, Parquet 등)

### 데이터 저장 경로

데이터는 다음 경로 형식으로 저장됩니다:

```
s3://yaml-{ACCOUNT_ID}/crawler-data/{topic-name}/{YYYY}/{MM}/{dd}/{HH}/part-{partition}-{timestamp}.json
```

예시:
```
s3://yaml-382045063773/crawler-data/danawa-crawl-specifications/2024/01/15/14/part-0-1705296000000.json
```

## 문제 해결

### Connector가 실행되지 않는 경우

1. **Kafka Connect Pod 상태 확인**:
   ```bash
   kubectl get pods -n apc-striming-ns -l strimzi.io/kind=KafkaConnect
   ```

2. **Pod 로그 확인**:
   ```bash
   kubectl logs -n apc-striming-ns <kafka-connect-pod-name>
   ```

3. **Connector 상태 확인**:
   ```bash
   kubectl describe kafkaconnector <connector-name> -n apc-striming-ns
   ```

### S3 접근 권한 오류

1. **AWS 자격증명 확인**:
   ```bash
   kubectl get secret kafka-connect-aws-credentials -n apc-striming-ns -o yaml
   ```

2. **S3 버킷 정책 확인**:
   ```bash
   aws s3api get-bucket-policy --bucket yaml-382045063773
   ```

### 데이터가 S3에 저장되지 않는 경우

1. **Kafka 토픽에 데이터가 있는지 확인**:
   ```bash
   kubectl exec -n apc-striming-ns -it <kafka-broker-pod> -- \
     kafka-console-consumer --bootstrap-server localhost:9092 \
     --topic danawa-crawl-specifications --from-beginning --max-messages 1
   ```

2. **Connector 오프셋 확인**:
   ```bash
   kubectl exec -n apc-striming-ns -it <kafka-connect-pod> -- \
     curl -s http://localhost:8083/connectors/s3-sink-specifications/status | jq
   ```

## 성능 튜닝

### 처리량 증가

- **tasksMax**: Connector 작업 수 증가 (토픽 파티션 수와 동일하게 설정 권장)
- **flush.size**: 더 큰 값으로 설정 (더 많은 레코드를 버퍼링)
- **s3.part.size**: 더 큰 값으로 설정 (더 큰 파일 생성)

### 비용 최적화

- **rotate.interval.ms**: 더 큰 값으로 설정 (파일 수 감소)
- **s3.compression.type**: `gzip`으로 설정 (저장 공간 절약)

## 참고 자료

- [Strimzi Kafka Connect 문서](https://strimzi.io/docs/operators/latest/deploying.html#proc-kafka-connect-str)
- [Confluent S3 Sink Connector 문서](https://docs.confluent.io/kafka-connect-s3-sink/current/)
- [Kafka Connect REST API](https://kafka.apache.org/documentation/#connect_rest)

