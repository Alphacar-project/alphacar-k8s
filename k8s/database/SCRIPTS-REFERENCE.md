# 스크립트 및 유틸리티 참조 가이드

이 문서는 `/home/alphacar/alphacar-final/k8s/database` 디렉터리에 있는 모든 스크립트와 유틸리티의 용도와 사용법을 설명합니다.

---

## 📋 배포 스크립트

### `deploy.sh`
**용도**: Kubernetes 리소스를 순서대로 배포하는 자동화 스크립트  
**사용법**:
```bash
./deploy.sh
```
**기능**:
- 네임스페이스 생성
- CRD 설치
- Operator 설치
- MongoDB, Kafka, Elasticsearch 등 순차 배포

---

## 🔍 Elasticsearch 관련

### `elasticsearch-setup.sh`
**용도**: Elasticsearch 인덱스 템플릿 설정  
**사용법**:
```bash
./elasticsearch-setup.sh
```
**기능**:
- Elasticsearch 연결 확인
- 인덱스 템플릿 생성
- 클러스터 상태 확인
- 인덱스 목록 확인

---

## 💾 백업 스크립트

### `backup-all.sh`
**용도**: 모든 백업을 한 번에 실행 (YAML 파일 + MongoDB)  
**사용법**:
```bash
./backup-all.sh
```

### `backup-mongodb-longhorn.sh`
**용도**: MongoDB Longhorn 볼륨 백업  
**사용법**:
```bash
./backup-mongodb-longhorn.sh
```

### `backup-yaml-files.sh`
**용도**: YAML 파일들을 tar.gz로 압축하여 백업  
**사용법**:
```bash
./backup-yaml-files.sh
```

### `restore-mongodb-from-backup.sh`
**용도**: MongoDB 백업에서 복원  
**사용법**:
```bash
./restore-mongodb-from-backup.sh <backup-name>
```

---

## ☁️ AWS/S3 관련

### `install-aws-cli.sh`
**용도**: AWS CLI 설치  
**사용법**:
```bash
./install-aws-cli.sh
```

### `load-aws-credentials.sh`
**용도**: AWS 자격증명 로드  
**사용법**:
```bash
source ./load-aws-credentials.sh
```

### `setup-aws-from-secret.sh`
**용도**: Kubernetes Secret에서 AWS 자격증명 설정  
**사용법**:
```bash
./setup-aws-from-secret.sh
```

### `setup-s3-bucket.sh`
**용도**: 단일 S3 버킷 생성 및 설정  
**사용법**:
```bash
./setup-s3-bucket.sh <bucket-name>
```

### `setup-s3-buckets.sh`
**용도**: 여러 S3 버킷 생성 및 설정  
**사용법**:
```bash
./setup-s3-buckets.sh
```

### `setup-s3-lifecycle.sh`
**용도**: S3 버킷 라이프사이클 정책 설정  
**사용법**:
```bash
./setup-s3-lifecycle.sh
```

### `cleanup-s3-buckets.sh`
**용도**: S3 버킷 정리 (테스트/개발용)  
**사용법**:
```bash
./cleanup-s3-buckets.sh
```

### `cleanup-s3-png-files.sh`
**용도**: S3에서 PNG 파일 정리  
**사용법**:
```bash
./cleanup-s3-png-files.sh
```

---

## 🔄 Velero 관련

### `setup-velero-backup.sh`
**용도**: Velero 백업 설정 자동화  
**사용법**:
```bash
./setup-velero-backup.sh
```
**기능**:
- ConfigMap 생성
- Secret 생성
- S3 버킷 생성
- BackupStorageLocation 및 Schedule 업데이트

### `setup-velero-secrets.sh`
**용도**: Velero AWS 자격증명 Secret 생성  
**사용법**:
```bash
./setup-velero-secrets.sh
```

### `test-velero-backup.sh`
**용도**: Velero 백업 테스트  
**사용법**:
```bash
./test-velero-backup.sh
```

---

## 🚗 차량 이미지 마이그레이션

### `migrate-car-images-to-s3.sh`
**용도**: 차량 이미지를 MongoDB에서 S3로 마이그레이션  
**사용법**:
```bash
./migrate-car-images-to-s3.sh
```

### `migrate-car-images.py`
**용도**: 차량 이미지 마이그레이션 Python 스크립트  
**사용법**:
```bash
python3 migrate-car-images.py
```

### `check-car-image-job.sh`
**용도**: 차량 이미지 Job 상태 확인  
**사용법**:
```bash
./check-car-image-job.sh
```

---

## 🔧 검증 및 유틸리티

### `validate-crawler-script.sh`
**용도**: 크롤러 스크립트 검증  
**사용법**:
```bash
./validate-crawler-script.sh
```

---

## 📝 스크립트 실행 권한 부여

모든 스크립트에 실행 권한을 부여하려면:
```bash
chmod +x *.sh
```

---

## ⚠️ 주의사항

1. **백업 스크립트**: 프로덕션 환경에서 실행 전 반드시 테스트하세요.
2. **S3 정리 스크립트**: 데이터 삭제 전 확인이 필요합니다.
3. **Velero 스크립트**: AWS 자격증명이 올바르게 설정되어 있어야 합니다.
4. **마이그레이션 스크립트**: 대량 데이터 처리 시 시간이 오래 걸릴 수 있습니다.

---

**최종 업데이트**: 2025-12-23


