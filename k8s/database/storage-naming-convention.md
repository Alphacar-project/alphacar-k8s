# 스토리지 네이밍 규칙

## PVC (PersistentVolumeClaim) 네이밍 규칙

### StatefulSet 사용 시
- **형식**: `{claim-name}-{statefulset-name}-{ordinal}`
- **예시**: 
  - `data-mongodb-0` (Primary)
  - `data-mongodb-1` (Secondary)
  - `data-mongodb-2` (Secondary)

### 일반 Deployment 사용 시
- **형식**: `{app-name}-{purpose}-{index}`
- **예시**:
  - `mongodb-data-0`
  - `kafka-logs-0`
  - `prometheus-storage`

## PV (PersistentVolume) 네이밍 규칙

### Longhorn 동적 프로비저닝
- **자동 생성**: Longhorn이 PVC 이름 기반으로 자동 생성
- **형식**: `pvc-{uuid}` (Kubernetes가 자동 생성)
- **참고**: PV는 UUID 기반이지만, PVC 이름으로 추적 가능

### 정적 프로비저닝 (수동 생성)
- **형식**: `{app-name}-pv-{index}`
- **예시**:
  - `mongodb-pv-0`
  - `mongodb-pv-1`
  - `mongodb-pv-2`

## 라벨 및 주석 규칙

### PVC 라벨
```yaml
labels:
  app: {application-name}        # 애플리케이션 이름
  component: {component-type}    # database, cache, logs 등
  storage-type: {storage-type}   # longhorn, local-path 등
```

### PVC 주석
```yaml
annotations:
  description: "볼륨 용도 설명"
  backup-policy: "daily"         # 백업 정책
```

## 예시: MongoDB StatefulSet

```yaml
volumeClaimTemplates:
- metadata:
    name: data                    # claim-name
    labels:
      app: mongodb
      component: database
      storage-type: longhorn
    annotations:
      description: "MongoDB data volume"
  spec:
    accessModes: [ReadWriteOnce]
    storageClassName: longhorn
    resources:
      requests:
        storage: 20Gi
```

**결과 PVC 이름**:
- `data-mongodb-0`
- `data-mongodb-1`
- `data-mongodb-2`

## 볼륨 조회 명령어

### PVC 조회
```bash
# 앱별 조회
kubectl get pvc -n {namespace} -l app=mongodb

# 스토리지 타입별 조회
kubectl get pvc -n {namespace} -l storage-type=longhorn

# 이름 패턴으로 조회
kubectl get pvc -n {namespace} | grep mongodb
```

### PV 조회
```bash
# PVC 이름으로 PV 찾기
kubectl get pv | grep {pvc-name}

# StorageClass별 조회
kubectl get pv | grep longhorn
```

### Longhorn 볼륨 조회
```bash
# Longhorn 볼륨 직접 조회
kubectl get volume -n apc-backup-ns | grep {pvc-name-pattern}

# PVC 이름으로 Longhorn 볼륨 찾기
PVC_NAME="data-mongodb-0"
kubectl get pvc $PVC_NAME -n apc-db-ns -o jsonpath='{.spec.volumeName}'
kubectl get volume -n apc-backup-ns $(kubectl get pvc $PVC_NAME -n apc-db-ns -o jsonpath='{.spec.volumeName}')
```

