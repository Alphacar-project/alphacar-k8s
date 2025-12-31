# 차량 이미지 S3 마이그레이션 Job 상태

## 현재 상태 (2025-12-23)

### Job 정보
- **Job 이름**: `car-image-migration`
- **네임스페이스**: `apc-backup-ns`
- **상태**: `Running` (44분 이상 실행 중)
- **Pod**: `car-image-migration-6zf4p` (Running)

### 처리 현황

#### MongoDB 데이터
- **전체 문서 수**: 475개
- **처리 완료 문서 수**: 95개 (약 20%)
- **처리 진행률**: 약 20% 완료

#### 처리 방식
- 원본 데이터는 **변경하지 않음**
- S3 URL은 별도 필드에 저장:
  - `s3_main_image`, `s3_image_url` 등 (기본 이미지)
  - `s3_exterior_images` (외관 이미지 배열)
  - `s3_interior_images` (내관 이미지 배열)
  - `s3_color_images` (색상별 이미지 배열)
  - `s3_images_metadata` (이미지 메타데이터)

### 설정 정보

#### 환경 변수
- **MongoDB URI**: `mongodb://triple_user:triple_password@mongodb.apc-db-ns.svc.cluster.local:27017/triple_db?authSource=admin&replicaSet=rs0`
- **S3 Bucket**: `carimage-382045063773`
- **S3 Prefix**: `images`
- **AWS Region**: `us-east-1` (ConfigMap에서 가져옴)

#### 볼륨 마운트
- **AWS 자격증명**: `cloud-credentials` Secret
- **마이그레이션 스크립트**: `car-image-migration-script` ConfigMap

### 동작 방식

1. **원본 데이터 보존**: MongoDB의 원본 이미지 URL 필드는 변경하지 않음
2. **S3 업로드**: 외부 URL 이미지를 다운로드하여 S3에 업로드
3. **별도 필드 저장**: S3 URL은 `s3_` 접두사가 붙은 별도 필드에 저장
4. **메타데이터 저장**: 각 이미지의 원본 URL, 타입, 차량 정보 등을 `s3_images_metadata` 배열에 저장

### 이미지 처리 타입

1. **기본 이미지** (`basic`): `main_image`, `image_url` 등
2. **외관 이미지** (`exterior`): `exterior_images` 배열
3. **내관 이미지** (`interior`): `interior_images` 배열
4. **색상별 이미지** (`color`): `color_images` 배열

### S3 저장 경로 구조

```
images/
  └── danawa_vehicle_data/
      └── {doc_id}/
          └── {vehicle_name}/
              └── {image_type}/
                  └── {color_name}/  (색상 이미지인 경우)
                      └── {hash}.{ext}
```

### 확인 방법

#### Job 상태 확인
```bash
kubectl get job car-image-migration -n apc-backup-ns
kubectl get pods -n apc-backup-ns | grep car-image
```

#### 로그 확인
```bash
kubectl logs -n apc-backup-ns -l app=car-image-migration --tail=100
```

#### 처리 현황 확인
```bash
# 전체 문서 수
kubectl exec -n apc-db-ns mongodb-0 -- mongosh -u triple_user -p triple_password --authenticationDatabase admin --eval "db.getSiblingDB('triple_db').danawa_vehicle_data.countDocuments({})" --quiet

# 처리 완료 문서 수
kubectl exec -n apc-db-ns mongodb-0 -- mongosh -u triple_user -p triple_password --authenticationDatabase admin --eval "db.getSiblingDB('triple_db').danawa_vehicle_data.countDocuments({s3_images_metadata: {\$exists: true}})" --quiet
```

#### S3 버킷 확인
```bash
# 업로드된 이미지 수
aws s3 ls s3://carimage-382045063773/images/ --recursive | wc -l

# 최근 업로드된 파일
aws s3 ls s3://carimage-382045063773/images/ --recursive | tail -10
```

### 주의사항

1. **원본 데이터 보존**: Job은 MongoDB의 원본 데이터를 변경하지 않습니다
2. **처리 시간**: 대량의 이미지 처리로 인해 시간이 오래 걸릴 수 있습니다
3. **네트워크 의존성**: 외부 이미지 다운로드가 실패할 경우 해당 이미지는 건너뜁니다
4. **재시작 안전성**: Job이 실패하거나 재시작되어도 이미 처리된 문서는 건너뜁니다 (S3 URL 확인)

### 문제 해결

#### Job이 멈춘 경우
```bash
# Pod 재시작
kubectl delete pod -n apc-backup-ns car-image-migration-6zf4p

# Job 재생성
kubectl apply -f migrate-car-images-job.yaml
```

#### 로그가 출력되지 않는 경우
```bash
# Pod 내부에서 직접 실행
kubectl exec -n apc-backup-ns car-image-migration-6zf4p -- python3 /scripts/migrate.py
```

### 예상 완료 시간

- **현재 진행률**: 약 20% (95/475 문서)
- **경과 시간**: 약 44분
- **예상 남은 시간**: 약 2-3시간 (네트워크 상태에 따라 다름)

---

**최종 업데이트**: 2025-12-23 06:26 UTC


