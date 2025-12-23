# Kubernetes Database 배포 파일 설명

이 디렉터리에는 Kubernetes 클러스터에 데이터베이스 및 관련 컴포넌트를 배포하기 위한 YAML 매니페스트 파일들이 포함되어 있습니다.

## 📚 문서 가이드

- **README.md** (이 파일): 전체 개요 및 배포 가이드
- **BACKEND-ELASTICSEARCH-INTEGRATION-GUIDE.md**: 백엔드 Elasticsearch 통합 가이드
- **SCRIPTS-REFERENCE.md**: 모든 스크립트 사용법 참조
- **backup-strategy.md**: 백업 전략 및 방법

## 파일 목록 및 설명

### 1. 기본 인프라

#### `namespaces.yaml`
- **목적**: Kubernetes 네임스페이스 생성
- **내용**: 
  - `apc-db-ns`: 데이터베이스 리소스용 네임스페이스
  - `apc-backup-ns`: 백업 및 스토리지 리소스용 네임스페이스
  - `apc-striming-ns`: Strimzi Kafka Operator용 네임스페이스
  - `admin`: 관리 UI용 네임스페이스
- **배포 순서**: 1순위 (가장 먼저 배포)

### 2. MongoDB

#### `mongodb-statefulset.yaml`
- **목적**: MongoDB Replica Set 배포
- **내용**:
  - Headless Service (Pod 간 직접 통신)
  - ClusterIP Service (외부 접근용)
  - StatefulSet (3개 Replica: Primary 1, Secondary 2)
  - Longhorn을 이용한 동적 PVC 프로비저닝 (20Gi per Pod)
- **네임스페이스**: `apc-db-ns`
- **배포 순서**: 네임스페이스 생성 후, Longhorn 설치 완료 후

### 3. Longhorn

#### `longhorn-ui.yaml`
- **목적**: Longhorn 관리 UI 배포
- **내용**:
  - Deployment (Longhorn UI)
  - Service (ClusterIP)
- **네임스페이스**: `admin`
- **배포 순서**: Longhorn이 Helm으로 설치된 후
- **주의**: Longhorn Manager가 `apc-backup-ns`에 설치되어 있어야 함

### 4. Velero (백업)

#### `velero-crds.yaml`
- **목적**: Velero CustomResourceDefinition 설치
- **내용**: Velero가 사용하는 모든 CRD 정의
- **배포 순서**: CRD는 Operator 설치 전에 배포

#### `velero-aws-config.yaml`
- **목적**: Velero AWS 설정을 위한 ConfigMap 및 Secret 템플릿
- **내용**:
  - ConfigMap: S3 버킷, 리전, 백업 TTL, 스케줄 설정
  - Secret 템플릿: AWS 자격증명 (실제 값은 별도 설정 필요)
- **네임스페이스**: `apc-backup-ns`
- **배포 순서**: Velero 설치 전

#### `velero-install.yaml`
- **목적**: Velero 백업 도구 설치
- **내용**:
  - ServiceAccount 및 RBAC
  - Velero Deployment
  - BackupStorageLocation (S3 설정 - ConfigMap 참조 가능)
  - Schedule (MongoDB 일일 백업, Kafka 일일 백업, 전체 클러스터 주간 백업)
- **네임스페이스**: `apc-backup-ns`
- **배포 순서**: ConfigMap 및 Secret 생성 후

### 5. Strimzi Kafka Operator

#### `strimzi-crds.yaml`
- **목적**: Strimzi Kafka Operator CRD 설치
- **내용**: Kafka, KafkaTopic, KafkaUser 등 Strimzi 관련 CRD
- **배포 순서**: CRD는 Operator 설치 전에 배포

#### `strimzi-operator.yaml`
- **목적**: Strimzi Kafka Operator 설치
- **내용**:
  - Namespace (`apc-striming-ns`)
  - Kafka CRD
  - ServiceAccount 및 RBAC
  - ClusterRole 및 ClusterRoleBinding
  - Strimzi Cluster Operator Deployment
- **네임스페이스**: `apc-striming-ns`
- **배포 순서**: CRD 설치 후

### 6. Kafka 클러스터

#### `kafka-cluster.yaml`
- **목적**: Kafka 클러스터 생성
- **내용**: Kafka 리소스 정의 (Strimzi Operator 사용)
- **네임스페이스**: `apc-striming-ns` (또는 지정된 네임스페이스)
- **배포 순서**: Strimzi Operator 설치 완료 후

#### `kafka-nodepool.yaml`
- **목적**: Kafka NodePool 생성
- **내용**: Kafka 브로커 노드 풀 정의
- **네임스페이스**: `apc-striming-ns` (또는 지정된 네임스페이스)
- **배포 순서**: Kafka 클러스터 생성 후

### 7. Elasticsearch & Kibana

#### `elasticsearch-deployment.yaml`
- **목적**: Elasticsearch 검색 엔진 배포
- **내용**:
  - StatefulSet (PV/PVC 없이 ephemeral storage 사용)
  - Headless Service
  - ConfigMap
- **네임스페이스**: `apc-ek-ns`
- **배포 순서**: 네임스페이스 생성 후

#### `kibana-deployment.yaml`
- **목적**: Kibana 대시보드 배포
- **내용**:
  - Deployment
  - Service (ClusterIP)
- **네임스페이스**: `apc-ek-ns`
- **배포 순서**: Elasticsearch 배포 후

#### `monstache-deployment.yaml`
- **목적**: MongoDB → Elasticsearch 실시간 동기화
- **내용**:
  - Deployment
  - ConfigMap (동기화 설정)
- **네임스페이스**: `apc-ek-ns`
- **배포 순서**: Elasticsearch 배포 후

#### `elasticsearch-index-template.json`
- **목적**: 유사어 검색을 위한 인덱스 템플릿
- **사용법**: `elasticsearch-setup.sh` 스크립트로 적용

### 8. Crawler

#### `crawler-deployment.yaml`
- **목적**: 크롤러 애플리케이션 배포
- **내용**:
  - ConfigMap (설정)
  - Deployment (크롤러 Pod)
- **네임스페이스**: 지정된 네임스페이스
- **배포 순서**: 인프라 구성 완료 후

## 배포 순서

1. **네임스페이스 생성**
   ```bash
   kubectl apply -f namespaces.yaml
   ```

2. **CRD 설치** (Operator 설치 전 필수)
   ```bash
   kubectl apply -f strimzi-crds.yaml
   kubectl apply -f velero-crds.yaml
   ```

3. **Operator 설치**
   ```bash
   kubectl apply -f strimzi-operator.yaml
   kubectl apply -f velero-install.yaml
   ```

4. **Longhorn UI** (Longhorn이 Helm으로 설치된 경우)
   ```bash
   kubectl apply -f longhorn-ui.yaml
   ```

5. **MongoDB StatefulSet** (Longhorn 설치 완료 후)
   ```bash
   kubectl apply -f mongodb-statefulset.yaml
   ```

6. **Kafka 클러스터** (Strimzi Operator 준비 후)
   ```bash
   kubectl apply -f kafka-cluster.yaml
   kubectl apply -f kafka-nodepool.yaml
   ```

7. **Elasticsearch & Kibana** (유사어 검색용)
   ```bash
   kubectl apply -f elasticsearch-deployment.yaml
   kubectl apply -f kibana-deployment.yaml
   kubectl apply -f monstache-deployment.yaml
   ./elasticsearch-setup.sh  # 인덱스 템플릿 적용
   ```

8. **Crawler** (선택사항)
   ```bash
   kubectl apply -f crawler-deployment.yaml
   ```

## 사전 요구사항

- Kubernetes 클러스터 (v1.34.2 이상 권장)
- kubectl 클라이언트 설치 및 클러스터 접근 권한
- Longhorn이 Helm으로 설치되어 있어야 함 (MongoDB StatefulSet 사용 시)
- AWS CLI 설치 (S3 버킷 생성 시, 선택사항)
- AWS 자격증명 (Velero 사용 시)

## Velero 백업 설정

### 자동 설정 (권장)

```bash
# 전체 Velero 백업 설정 자동화
./setup-velero-backup.sh
```

이 스크립트는 다음을 자동으로 수행합니다:
1. ConfigMap 생성 (AWS S3 설정)
2. Secret 생성 (AWS 자격증명)
3. S3 버킷 생성 및 설정 (없는 경우)
4. Velero BackupStorageLocation 및 Schedule 업데이트

### 수동 설정

#### 1. ConfigMap 생성
```bash
kubectl apply -f velero-aws-config.yaml
```

#### 2. AWS 자격증명 Secret 생성
```bash
./setup-velero-secrets.sh
```

#### 3. S3 버킷 생성 (없는 경우)
```bash
./setup-s3-bucket.sh
```

#### 4. Velero 설치
```bash
kubectl apply -f velero-install.yaml
```

## 주의사항

1. **네임스페이스**: 일부 파일에서 네임스페이스가 하드코딩되어 있을 수 있습니다. 배포 전 확인 필요
2. **Longhorn**: MongoDB StatefulSet은 Longhorn StorageClass를 사용하므로, Longhorn이 먼저 설치되어 있어야 합니다
3. **CRD**: CRD는 Operator보다 먼저 설치되어야 합니다
4. **순서**: 배포 순서를 반드시 지켜야 정상 작동합니다

## 배포 스크립트 사용

자동 배포를 위해 `deploy.sh` 스크립트를 사용할 수 있습니다:

```bash
chmod +x deploy.sh
./deploy.sh
```

스크립트는 배포 순서를 자동으로 관리하며, 각 단계의 성공 여부를 확인합니다.

## S3 라이프사이클 정책 설정

백업 테스트가 완료된 후, S3 라이프사이클 정책을 설정하여 스토리지 비용을 최적화할 수 있습니다.

### 자동 설정

```bash
./setup-s3-lifecycle.sh
```

### 라이프사이클 정책 내용

1. **Velero 백업 (apc-backup/backups/)**:
   - 30일 후: STANDARD_IA (Infrequent Access)로 이동
   - 90일 후: GLACIER로 이동
   - 180일 후: DEEP_ARCHIVE로 이동
   - 365일 후: 자동 삭제

2. **YAML 파일 (apc-backup/yaml-files/)**:
   - 90일 후: STANDARD_IA로 이동
   - 180일 후: GLACIER로 이동
   - 730일 후: 자동 삭제

3. **버전 관리**:
   - 30일 후: STANDARD_IA로 이동
   - 90일 후: GLACIER로 이동
   - 180일 후: 자동 삭제

### 수동 설정

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket velero-backups-382045063773 \
  --lifecycle-configuration file://s3-lifecycle-policy.json
```

### 정책 확인

```bash
aws s3api get-bucket-lifecycle-configuration --bucket velero-backups-382045063773
```

## Elasticsearch 유사어 검색

Elasticsearch는 검색 백엔드에서 유사어 검색 기능을 제공하기 위해 구축되었습니다.

### 주요 정보
- **네임스페이스**: `apc-ek-ns`
- **Elasticsearch URL**: `http://elasticsearch.apc-ek-ns.svc.cluster.local:9200`
- **Kibana URL**: `http://kibana.apc-ek-ns.svc.cluster.local:5601`
- **인덱스**: `vehicles` (MongoDB `triple_db.danawa_vehicle_data` 컬렉션 동기화)

### 백엔드 통합
백엔드 개발자를 위한 상세 가이드는 **`BACKEND-ELASTICSEARCH-INTEGRATION-GUIDE.md`** 파일을 참조하세요.

### 주요 기능
- 한글 오타 교정 (Fuzzy 검색)
- 자모 분리 검색 (N-gram)
- 부분 문자열 검색
- 실시간 MongoDB 동기화 (Monstache)

## 스크립트 및 유틸리티

모든 스크립트의 사용법은 **`SCRIPTS-REFERENCE.md`** 파일을 참조하세요.

주요 스크립트:
- `deploy.sh`: 전체 배포 자동화
- `elasticsearch-setup.sh`: Elasticsearch 인덱스 템플릿 설정
- `setup-velero-backup.sh`: Velero 백업 설정 자동화
- `backup-all.sh`: 전체 백업 실행

