# Velero + S3 + Longhorn 백업 전략

## 개요

이 문서는 Kubernetes 클러스터의 리소스와 데이터를 백업하기 위한 전략을 설명합니다.

### 백업 대상
1. **Kubernetes YAML 파일**: `/home/alphacar/alphacar-final/k8s/database/` 디렉터리의 모든 YAML 파일
2. **MongoDB 데이터**: MongoDB StatefulSet의 데이터 (Longhorn 볼륨 포함)

### 백업 도구
- **Velero**: Kubernetes 리소스 및 PVC 백업
- **S3**: 백업 저장소 (AWS S3 호환)
- **Longhorn**: 볼륨 스냅샷 (MongoDB 데이터)

## 백업 구성

### 1. Velero 설정

#### BackupStorageLocation
- **이름**: `default`
- **Provider**: AWS (S3 호환)
- **Bucket**: `velero-backups`
- **Prefix**: `apc-backup`
- **Region**: `us-east-1`

#### 자격증명
- **Secret**: `cloud-credentials` (apc-backup-ns)
- **포함 정보**: AWS Access Key, Secret Key

### 2. 백업 스케줄

#### MongoDB 일일 백업
- **Schedule**: 매일 오전 2시 (0 2 * * *)
- **대상**: `apc-db-ns` 네임스페이스의 MongoDB 리소스
- **TTL**: 30일 (720시간)
- **포함**: StatefulSet, PVC, ConfigMap 등

#### Kafka 일일 백업
- **Schedule**: 매일 오전 3시 (0 3 * * *)
- **대상**: `apc-striming-ns` 네임스페이스의 Kafka 리소스
- **TTL**: 30일 (720시간)

#### 전체 클러스터 주간 백업
- **Schedule**: 매주 일요일 오전 1시 (0 1 * * 0)
- **대상**: 모든 네임스페이스 (apc-db-ns, apc-striming-ns, apc-backup-ns)
- **TTL**: 90일 (2160시간)

### 3. Longhorn 스냅샷 전략

MongoDB 데이터는 Longhorn 볼륨을 사용하므로, Longhorn의 스냅샷 기능을 활용할 수 있습니다.

#### 장점
- 빠른 스냅샷 생성 (볼륨 레벨)
- Velero 백업과 독립적으로 관리 가능
- 즉시 복원 가능

#### 단점
- S3에 직접 저장되지 않음 (Longhorn 내부 저장)
- 클러스터 외부 백업이 아님

## 백업 실행 방법

### 1. YAML 파일 백업

```bash
# 백업 스크립트 실행
./backup-yaml-files.sh

# 또는 수동 백업
tar -czf k8s-database-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  /home/alphacar/alphacar-final/k8s/database/*.yaml \
  /home/alphacar/alphacar-final/k8s/database/*.md \
  /home/alphacar/alphacar-final/k8s/database/*.sh

# S3에 업로드 (AWS CLI 필요)
aws s3 cp k8s-database-backup-*.tar.gz s3://velero-backups/apc-backup/yaml-files/
```

### 2. MongoDB 데이터 백업 (Velero)

```bash
# 수동 백업 실행
velero backup create mongodb-manual-backup-$(date +%Y%m%d-%H%M%S) \
  --include-namespaces apc-db-ns \
  --selector app=mongodb \
  --storage-location default \
  --ttl 720h

# 또는 kubectl 사용
kubectl create backup mongodb-manual-backup-$(date +%Y%m%d-%H%M%S) \
  --namespace apc-backup-ns \
  --from-schedule mongodb-daily-backup
```

### 3. MongoDB 데이터 백업 (Longhorn 스냅샷)

```bash
# Longhorn 볼륨 스냅샷 생성
for pvc in data-mongodb-0 data-mongodb-1 data-mongodb-2; do
  VOLUME_NAME=$(kubectl get pvc $pvc -n apc-db-ns -o jsonpath='{.spec.volumeName}')
  kubectl create snapshot longhorn.io/v1beta2 \
    --namespace apc-backup-ns \
    --volume=$VOLUME_NAME \
    --name=mongodb-${pvc}-snapshot-$(date +%Y%m%d-%H%M%S)
done
```

### 4. 통합 백업 스크립트

```bash
# 모든 백업을 한 번에 실행
./backup-all.sh
```

## 복원 방법

### 1. YAML 파일 복원

```bash
# S3에서 다운로드
aws s3 cp s3://velero-backups/apc-backup/yaml-files/k8s-database-backup-YYYYMMDD-HHMMSS.tar.gz .

# 압축 해제
tar -xzf k8s-database-backup-*.tar.gz

# 파일 확인 및 배포
cd /home/alphacar/alphacar-final/k8s/database
./deploy.sh
```

### 2. MongoDB 데이터 복원 (Velero)

```bash
# 백업 목록 확인
velero backup get

# 복원 실행
velero restore create mongodb-restore-$(date +%Y%m%d-%H%M%S) \
  --from-backup mongodb-daily-backup-YYYYMMDD-HHMMSS \
  --include-namespaces apc-db-ns

# 또는 kubectl 사용
kubectl create restore mongodb-restore-$(date +%Y%m%d-%H%M%S) \
  --namespace apc-backup-ns \
  --from-backup mongodb-daily-backup-YYYYMMDD-HHMMSS
```

### 3. MongoDB 데이터 복원 (Longhorn 스냅샷)

```bash
# 스냅샷 목록 확인
kubectl get snapshots -n apc-backup-ns

# 스냅샷에서 볼륨 복원
kubectl create volume longhorn.io/v1beta2 \
  --namespace apc-backup-ns \
  --from-snapshot=mongodb-data-mongodb-0-snapshot-YYYYMMDD-HHMMSS \
  --name=mongodb-restored-volume
```

## 백업 검증

### Velero 백업 확인

```bash
# 백업 목록
velero backup get

# 백업 상세 정보
velero backup describe <backup-name>

# 백업 로그
velero backup logs <backup-name>
```

### Longhorn 스냅샷 확인

```bash
# 스냅샷 목록
kubectl get snapshots -n apc-backup-ns

# 볼륨 스냅샷 확인
kubectl get volumes -n apc-backup-ns -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.snapshots[*].name}{"\n"}{end}'
```

### S3 백업 확인

```bash
# S3 버킷 내용 확인
aws s3 ls s3://velero-backups/apc-backup/ --recursive

# YAML 파일 백업 확인
aws s3 ls s3://velero-backups/apc-backup/yaml-files/
```

## 백업 모니터링

### Velero 백업 상태 확인

```bash
# 최근 백업 상태
kubectl get backups -n apc-backup-ns --sort-by=.metadata.creationTimestamp | tail -10

# 실패한 백업 확인
kubectl get backups -n apc-backup-ns -o json | jq '.items[] | select(.status.phase=="Failed")'
```

### 백업 알림 설정 (선택사항)

Velero 백업 실패 시 알림을 받으려면:
- Velero의 webhook 기능 사용
- 또는 별도의 모니터링 도구 연동

## 주의사항

1. **S3 자격증명**: `cloud-credentials` Secret이 올바르게 설정되어 있어야 합니다.
2. **백업 공간**: S3 버킷의 용량을 주기적으로 확인하세요.
3. **백업 테스트**: 정기적으로 복원 테스트를 수행하여 백업의 무결성을 확인하세요.
4. **TTL 관리**: 백업 TTL을 적절히 설정하여 오래된 백업이 자동으로 삭제되도록 합니다.
5. **Longhorn 스냅샷**: Longhorn 스냅샷은 클러스터 내부에만 저장되므로, 장기 보관을 위해서는 Velero 백업을 사용하세요.

## 백업 일정 요약

| 백업 유형 | 스케줄 | TTL | 저장 위치 |
|---------|--------|-----|----------|
| MongoDB 일일 백업 | 매일 02:00 | 30일 | S3 |
| Kafka 일일 백업 | 매일 03:00 | 30일 | S3 |
| 전체 클러스터 주간 백업 | 매주 일요일 01:00 | 90일 | S3 |
| YAML 파일 백업 | 수동 또는 스크립트 | 무제한 | S3 |
| Longhorn 스냅샷 | 수동 또는 스크립트 | Longhorn 설정에 따름 | Longhorn 내부 |



