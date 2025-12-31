# 💾 Longhorn & Velero → AWS 마이그레이션 분석

## 📋 목차
1. [현재 사용 현황](#현재-사용-현황)
2. [Longhorn → AWS 스토리지 대체](#longhorn--aws-스토리지-대체)
3. [Velero → AWS 백업 대체](#velero--aws-백업-대체)
4. [비용 분석](#비용-분석)
5. [마이그레이션 전략](#마이그레이션-전략)

---

## 🔍 현재 사용 현황

### Longhorn (분산 블록 스토리지)

**현재 구성**:
- **StorageClass**: `longhorn`
- **사용 중인 PVC**:
  - MongoDB: 20Gi x 3 (StatefulSet)
  - Loki: 5Gi
  - aichat-vector-store: 10Gi
  - 총: 약 75Gi

**기능**:
- 동적 PVC 프로비저닝
- 볼륨 복제 (Replica)
- 스냅샷 생성 (RecurringJob)
- Longhorn UI로 관리

**스냅샷 정책**:
- MongoDB: 매일 오전 1시 스냅샷
- 보존 기간: 7일

---

### Velero (Kubernetes 백업)

**현재 구성**:
- **백업 저장소**: S3 (mongodb-382045063773 버킷)
- **백업 스케줄**:
  - MongoDB 일일 백업: 매일 오전 2시
  - Kafka 일일 백업: 매일 오전 3시
  - 전체 클러스터 주간 백업: 매주 일요일 오전 1시

**백업 내용**:
- Kubernetes 리소스 (YAML)
- Longhorn 볼륨 스냅샷 (`snapshotVolumes: true`)
- 네임스페이스별 백업

**보존 정책**:
- MongoDB 백업: 720시간 (30일)
- Kafka 백업: 720시간 (30일)
- 전체 백업: 2160시간 (90일)

---

## 🔄 Longhorn → AWS 스토리지 대체

### 옵션 1: Amazon EBS (Elastic Block Store) ✅ 권장

#### 대체 이유
1. **완전 관리형**: AWS가 자동으로 관리
2. **고성능**: SSD 기반, 낮은 지연시간
3. **자동 스냅샷**: EBS 스냅샷 자동 생성
4. **Multi-AZ 복제**: 자동으로 다른 가용 영역에 복제
5. **비용 효율**: 사용한 만큼만 비용 지불

#### 비용 분석
```
Longhorn (온프레미스):
- 하드웨어 상각: $0 (이미 구매됨)
- 운영 비용: $50/월
- 관리 시간: 2시간/월 x $50 = $100
총: $150/월

EBS (AWS):
- 스토리지: 75Gi x $0.10/GB/월 = $7.5/월
- 스냅샷: 75Gi x 30일 x $0.05/GB/월 = $112.5/월
- 관리 시간: 0.5시간/월 x $50 = $25
총: $145/월

비용: 거의 동일하지만 관리 부담 감소
```

#### 마이그레이션 방법

**1. EBS CSI Driver 설치**
```bash
# EBS CSI Driver 설치
kubectl apply -k "github.com/kubernetes-sigs/aws-ebs-csi-driver/deploy/kubernetes/overlays/stable/?ref=release-1.28"

# StorageClass 생성
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-sc
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
parameters:
  type: gp3
  fsType: ext4
  encrypted: "true"
allowVolumeExpansion: true
EOF
```

**2. PVC 마이그레이션**
```yaml
# 기존 PVC (Longhorn)
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-data-mongodb-0
spec:
  storageClassName: longhorn
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi

# 변경 후 (EBS)
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-data-mongodb-0
spec:
  storageClassName: ebs-sc  # 변경
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

**3. 데이터 마이그레이션**
```bash
# 1. Longhorn에서 스냅샷 생성
# Longhorn UI에서 수동 생성 또는
kubectl apply -f longhorn-snapshot.yaml

# 2. 데이터 복사 (StatefulSet 재생성 전)
# Pod를 0으로 스케일 다운
kubectl scale statefulset mongodb --replicas=0

# 3. PVC를 EBS StorageClass로 변경
kubectl patch pvc mongodb-data-mongodb-0 -p '{"spec":{"storageClassName":"ebs-sc"}}'

# 4. StatefulSet 재생성 (자동으로 EBS 볼륨 생성)
kubectl scale statefulset mongodb --replicas=3
```

---

### 옵션 2: Amazon EFS (Elastic File System) ⚠️ 조건부

#### 사용 시나리오
- **ReadWriteMany (RWX)** 접근 모드가 필요한 경우
- 여러 Pod가 동시에 같은 볼륨에 접근해야 하는 경우

#### 장점
- 여러 Pod에서 동시 접근 가능
- 자동 스케일링
- 완전 관리형

#### 단점
- 비용이 EBS보다 높음
- 지연시간이 EBS보다 높음
- ReadWriteOnce (RWO)에는 과함

#### 비용 분석
```
EFS:
- 스토리지: 75Gi x $0.30/GB/월 = $22.5/월
- 처리량: $0.05/GB/월 = $3.75/월
총: $26.25/월

EBS 대비: 약 3.5배 비쌈
```

**결론**: ReadWriteMany가 필요한 경우에만 사용

---

## 🔄 Velero → AWS 백업 대체

### 옵션 1: Velero 유지 + S3 연동 ✅ 권장

#### 유지하는 이유
1. **Kubernetes 네이티브**: Kubernetes 리소스 백업에 최적
2. **이미 구축됨**: 현재 설정 그대로 사용 가능
3. **유연성**: 네임스페이스, 리소스 선택적 백업
4. **크로스 플랫폼**: 다른 클라우드로도 마이그레이션 가능

#### AWS 통합
```yaml
# Velero BackupStorageLocation (AWS S3)
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: default
  namespace: velero
spec:
  provider: aws
  objectStorage:
    bucket: alphacar-velero-backups  # AWS S3 버킷
    prefix: backups
  config:
    region: ap-northeast-2
    s3ForcePathStyle: "false"
  credential:
    name: cloud-credentials
    key: cloud
```

#### 비용 분석
```
Velero (온프레미스):
- 인스턴스: $30/월
- S3 스토리지: $10/월 (백업 데이터)
- 관리 시간: 2시간/월 x $50 = $100
총: $140/월

Velero (AWS):
- 인스턴스: $0 (EKS Pod로 실행)
- S3 스토리지: $10/월 (백업 데이터)
- 관리 시간: 0.5시간/월 x $50 = $25
총: $35/월

절감: $105/월 (75% 절감)
```

---

### 옵션 2: AWS Backup ⚠️ 조건부

#### 사용 시나리오
- EBS 볼륨만 백업하는 경우
- AWS 서비스 통합이 중요한 경우

#### 장점
- AWS 네이티브 서비스
- EBS 스냅샷 자동 관리
- 라이프사이클 정책 자동화

#### 단점
- Kubernetes 리소스 백업 불가
- Velero보다 제한적

#### 비용 분석
```
AWS Backup:
- 백업 스토리지: 75Gi x $0.095/GB/월 = $7.13/월
- 관리 시간: 0.5시간/월 x $50 = $25
총: $32.13/월

Velero 대비: 비슷하지만 기능 제한적
```

**결론**: EBS 볼륨만 백업하면 AWS Backup, Kubernetes 리소스도 백업하면 Velero 유지

---

### 옵션 3: 하이브리드 접근 ✅ 최적

#### 전략
- **EBS 스냅샷**: AWS Backup으로 자동 관리
- **Kubernetes 리소스**: Velero로 백업
- **최종 저장소**: S3

#### 구성
```
EBS 볼륨
  ↓ (자동 스냅샷)
AWS Backup
  ↓ (S3로 복사)
S3 (장기 보관)

Kubernetes 리소스
  ↓ (Velero)
S3 (백업 파일)
```

#### 비용 분석
```
하이브리드:
- AWS Backup: $7.13/월
- Velero (Pod): $0
- S3 스토리지: $10/월
- 관리 시간: 0.5시간/월 x $50 = $25
총: $42.13/월

효과: 최고의 백업 전략 (이중 백업)
```

---

## 💰 종합 비용 분석

### 시나리오 1: Longhorn → EBS, Velero 유지

```
현재 (온프레미스):
- Longhorn: $150/월
- Velero: $140/월
총: $290/월

AWS:
- EBS: $145/월
- Velero: $35/월
총: $180/월

절감: $110/월 (38% 절감)
```

### 시나리오 2: 하이브리드 백업 (EBS + Velero)

```
AWS:
- EBS: $145/월
- AWS Backup: $7.13/월
- Velero: $35/월
- S3: $10/월
총: $197.13/월

효과: 이중 백업으로 안정성 향상
```

---

## 🎯 마이그레이션 전략

### Phase 1: EBS CSI Driver 설치 (1주)

1. **EBS CSI Driver 설치**
   ```bash
   kubectl apply -k "github.com/kubernetes-sigs/aws-ebs-csi-driver/deploy/kubernetes/overlays/stable/?ref=release-1.28"
   ```

2. **StorageClass 생성**
   ```yaml
   apiVersion: storage.k8s.io/v1
   kind: StorageClass
   metadata:
     name: ebs-sc
   provisioner: ebs.csi.aws.com
   parameters:
     type: gp3
     encrypted: "true"
   ```

3. **테스트 PVC 생성**
   ```bash
   kubectl apply -f test-pvc.yaml
   ```

### Phase 2: 데이터 마이그레이션 (2주)

1. **MongoDB 마이그레이션**
   - StatefulSet 스케일 다운
   - PVC StorageClass 변경
   - 데이터 복사
   - StatefulSet 재생성

2. **다른 PVC 마이그레이션**
   - Loki
   - aichat-vector-store

### Phase 3: Velero 설정 업데이트 (1주)

1. **S3 버킷 생성**
   ```bash
   aws s3 mb s3://alphacar-velero-backups
   ```

2. **Velero 재설치 (AWS S3 연동)**
   ```bash
   velero install \
     --provider aws \
     --plugins velero/velero-plugin-for-aws:v1.9.0 \
     --bucket alphacar-velero-backups \
     --secret-file ./credentials-velero \
     --use-volume-snapshots=false \
     --backup-location-config region=ap-northeast-2
   ```

3. **백업 스케줄 재생성**
   ```yaml
   apiVersion: velero.io/v1
   kind: Schedule
   metadata:
     name: mongodb-daily-backup
   spec:
     schedule: "0 2 * * *"
     template:
       includedNamespaces:
       - apc-db-ns
       storageLocation: default
   ```

### Phase 4: Longhorn 제거 (1주)

1. **모든 PVC 마이그레이션 확인**
2. **Longhorn 제거**
   ```bash
   helm uninstall longhorn -n longhorn-system
   ```

---

## 📊 비교표

| 항목 | Longhorn | EBS | 비교 |
|------|----------|-----|------|
| **관리 방식** | 자체 관리 | 완전 관리형 | ✅ EBS 우위 |
| **성능** | 좋음 | 매우 좋음 | ✅ EBS 우위 |
| **스냅샷** | 수동/RecurringJob | 자동 | ✅ EBS 우위 |
| **복제** | 수동 설정 | Multi-AZ 자동 | ✅ EBS 우위 |
| **비용** | $150/월 | $145/월 | 비슷 |
| **관리 부담** | 높음 | 낮음 | ✅ EBS 우위 |

| 항목 | Velero | AWS Backup | 비교 |
|------|--------|------------|------|
| **K8s 리소스 백업** | ✅ 지원 | ❌ 미지원 | ✅ Velero 우위 |
| **EBS 스냅샷** | ✅ 지원 | ✅ 지원 | 동일 |
| **유연성** | 높음 | 낮음 | ✅ Velero 우위 |
| **비용** | $35/월 | $32/월 | 비슷 |
| **크로스 플랫폼** | ✅ 가능 | ❌ AWS만 | ✅ Velero 우위 |

---

## ✅ 최종 권장사항

### Longhorn → EBS ✅ 대체 권장

**이유**:
1. 완전 관리형으로 운영 부담 감소
2. 자동 스냅샷 및 Multi-AZ 복제
3. 비용 거의 동일
4. 성능 향상

**마이그레이션 시점**:
- 하드웨어 교체 시점에 함께 진행
- 또는 즉시 진행 가능 (비용 차이 미미)

---

### Velero → 유지 + AWS S3 연동 ✅ 권장

**이유**:
1. Kubernetes 리소스 백업에 최적
2. 이미 구축되어 있음
3. 크로스 플랫폼 가능
4. AWS S3와 완벽 통합

**추가 권장**:
- **하이브리드 접근**: EBS 스냅샷은 AWS Backup으로, Kubernetes 리소스는 Velero로
- **이중 백업**: 안정성 향상

---

## 📋 마이그레이션 체크리스트

### Longhorn → EBS
- [ ] EBS CSI Driver 설치
- [ ] StorageClass 생성
- [ ] 테스트 PVC 생성 및 검증
- [ ] MongoDB PVC 마이그레이션
- [ ] Loki PVC 마이그레이션
- [ ] aichat-vector-store PVC 마이그레이션
- [ ] 데이터 검증
- [ ] Longhorn 제거

### Velero → AWS S3
- [ ] S3 버킷 생성
- [ ] IAM 역할 및 정책 설정
- [ ] Velero 재설치 (AWS S3 연동)
- [ ] 백업 스케줄 재생성
- [ ] 백업 테스트
- [ ] 복원 테스트

### 하이브리드 백업 (선택)
- [ ] AWS Backup 설정
- [ ] EBS 스냅샷 정책 생성
- [ ] Velero와 AWS Backup 병행 운영

---

## 🔗 관련 문서

- [AWS EBS CSI Driver](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)
- [Velero AWS Plugin](https://velero.io/docs/v1.13/aws-config/)
- [AWS Backup](https://docs.aws.amazon.com/aws-backup/)
- [기술 대체 가이드](./AWS-TECHNOLOGY-REPLACEMENT-GUIDE.md)

---

**작성일**: 2024년
**버전**: 1.0
**담당**: 데이터 및 SecOps

