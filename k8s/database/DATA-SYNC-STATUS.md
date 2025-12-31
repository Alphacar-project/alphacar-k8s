# 데이터 동기화 및 검색 백엔드 마이그레이션 현황

## 현재 상태 (2025-12-23)

### 1. 데이터 동기화 현황

#### MongoDB 데이터
- **컬렉션**: `triple_db.danawa_vehicle_data`
- **문서 수**: 475개
- **주요 필드**: 
  - `vehicle_name`, `vehicle_name_full`
  - `brand_name`, `model_name`
  - `model_id`, `lineup_id`
  - `main_image`, `logo_url`
  - `fuel_type`, `model_year`

#### Elasticsearch 인덱스
- **인덱스명**: `vehicles`
- **현재 문서 수**: 2개 (동기화 진행 중)
- **상태**: Monstache 재시작 후 정상 동기화 중

#### Monstache 동기화
- **상태**: ✅ 정상 작동 중
- **재시작**: 완료 (2025-12-23 11:00)
- **설정 업데이트**: 완료
  - 동적 매핑 허용
  - 필드 제한 증가 (2000개)
  - **단일 컬렉션 동기화**: `triple_db.danawa_vehicle_data`만 동기화
  - **초기 동기화 활성화**: `direct-read-namespaces` 설정으로 기존 데이터 동기화
- **동기화 컬렉션**:
  - `triple_db.danawa_vehicle_data` → `vehicles` (검색 백엔드 전용)

### 2. 검색 백엔드 현황

#### 현재 상태
- **Deployment**: `search-backend` (apc-be-ns)
- **이미지**: `192.168.0.169/bh/alphacar-search:1.0.1`
- **포트**: 3007
- **현재 데이터 소스**: ❌ **MongoDB** (`danawa_vehicle_data` 컬렉션)

#### 사용 중인 코드
- **스키마**: `src/vehicle.schema.ts` - MongoDB 스키마 사용
- **서비스**: `src/app.service.ts` - Mongoose Model 사용
- **모듈**: `src/app.module.ts` - MongooseModule 사용

### 3. 필요한 작업

#### ✅ 완료된 작업
1. Monstache 설정 업데이트
2. Elasticsearch 인덱스 템플릿 설정
3. Elasticsearch 동적 매핑 허용
4. Monstache 재시작 및 동기화 시작

#### ⏳ 진행 중인 작업
1. **데이터 동기화**: MongoDB → Elasticsearch
   - 현재 2개 문서 인덱스됨
   - 475개 문서 동기화 대기 중
   - 예상 시간: Monstache가 변경사항을 감지하여 점진적으로 동기화

#### 📋 남은 작업
1. **검색 백엔드 코드 변경**
   - [ ] Elasticsearch 클라이언트 설치 (`@elastic/elasticsearch`)
   - [ ] Elasticsearch 서비스 생성
   - [ ] 검색 로직 MongoDB → Elasticsearch 변경
   - [ ] 환경 변수 설정 (ELASTICSEARCH_URL)
   - [ ] 모듈 등록 및 의존성 주입

2. **테스트**
   - [ ] 기본 검색 테스트
   - [ ] 한글 유사어 검색 테스트
   - [ ] 성능 테스트

3. **배포**
   - [ ] 검색 백엔드 이미지 빌드
   - [ ] Deployment 업데이트
   - [ ] 롤아웃 확인

## 4. 동기화 확인 방법

### 문서 수 확인
```bash
# MongoDB 문서 수
kubectl exec -n apc-db-ns mongodb-0 -- mongosh --quiet --username admin --password 123 --authenticationDatabase admin --eval "db.getSiblingDB('triple_db').danawa_vehicle_data.countDocuments()"

# Elasticsearch 문서 수
kubectl exec -n apc-ek-ns elasticsearch-0 -- curl -s "http://localhost:9200/vehicles/_count"
```

### Monstache 로그 확인
```bash
kubectl logs -n apc-ek-ns -l app=monstache --tail=50 | grep -E "Indexed|Created|Updated|Failed"
```

### 동기화 강제 실행 (필요시)
MongoDB에 변경사항이 없으면 Monstache가 동기화하지 않을 수 있습니다. 
테스트를 위해 MongoDB에 더미 업데이트를 수행하거나, 
Monstache를 재시작하여 전체 동기화를 트리거할 수 있습니다.

## 5. 검색 백엔드 마이그레이션 가이드

자세한 마이그레이션 가이드는 `SEARCH-BACKEND-MIGRATION-GUIDE.md`를 참고하세요.

### 주요 변경사항
1. **의존성 추가**: `@elastic/elasticsearch`
2. **서비스 생성**: `ElasticsearchService`
3. **검색 로직 변경**: Mongoose → Elasticsearch Client
4. **환경 변수**: `ELASTICSEARCH_URL` 추가

## 6. 다음 단계

### 즉시 수행
1. ✅ Monstache 동기화 모니터링
2. ✅ Elasticsearch 문서 수 증가 확인

### 데이터 동기화 완료 후
1. 검색 백엔드 코드 변경
2. 테스트
3. 배포

### 우선순위
1. **높음**: 데이터 동기화 완료 확인
2. **높음**: 검색 백엔드 Elasticsearch 연동
3. **중간**: 한글 유사어 검색 테스트
4. **낮음**: 성능 최적화

---

**업데이트**: 2025-12-23 10:57
**상태**: 데이터 동기화 진행 중, 검색 백엔드 마이그레이션 준비 완료

