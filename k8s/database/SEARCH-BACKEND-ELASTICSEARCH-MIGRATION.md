# 검색 백엔드 Elasticsearch 마이그레이션 완료 가이드

## ✅ 완료된 작업

### 1. 데이터 동기화 완료
- **MongoDB 문서**: 475개
- **Elasticsearch 인덱스**: 475개 ✅
- **동기화 상태**: 완료

### 2. 검색 백엔드 코드 변경 완료

#### 생성된 파일
- ✅ `src/elasticsearch.service.ts`: Elasticsearch 클라이언트 서비스
- ✅ `src/app.service.ts`: MongoDB → Elasticsearch로 변경 완료
- ✅ `src/app.module.ts`: Elasticsearch 서비스 등록 완료

#### 수정된 파일
- ✅ `package.json`: `@elastic/elasticsearch` 의존성 추가 필요

## 📋 다음 단계

### 1. 의존성 설치

검색 백엔드 디렉토리에서 실행:

```bash
cd /home/alphacar/alphacar-final/dev/alphacar/backend/search
npm install @elastic/elasticsearch
```

### 2. 환경 변수 설정

검색 백엔드 Deployment에 환경 변수 추가:

```yaml
env:
  - name: ELASTICSEARCH_URL
    value: "http://elasticsearch.apc-ek-ns.svc.cluster.local:9200"
  - name: ELASTICSEARCH_INDEX
    value: "vehicles"
```

또는 ConfigMap 사용:

```bash
kubectl apply -f /home/alphacar/alphacar-final/k8s/database/search-backend-elasticsearch-config.yaml
```

그리고 Deployment에 env 섹션 추가.

### 3. 빌드 및 배포

```bash
cd /home/alphacar/alphacar-final/dev/alphacar/backend/search
npm run build
# Docker 이미지 빌드 및 푸시
# Deployment 업데이트
```

### 4. 테스트

배포 후 검색 API 테스트:

```bash
# 기본 검색
curl "http://search-backend.apc-be-ns.svc.cluster.local:3007/search?keyword=아반떼"

# 유사어 검색 테스트
curl "http://search-backend.apc-be-ns.svc.cluster.local:3007/search?keyword=dkqksEp"
curl "http://search-backend.apc-be-ns.svc.cluster.local:3007/search?keyword=어반떼"
```

## 🔍 주요 변경사항

### 검색 기능 개선
- **이전**: MongoDB 정규식 검색 (정확한 일치만)
- **이후**: Elasticsearch 유사어 검색
  - 한글 오타 허용 (fuzziness: AUTO)
  - N-gram 부분 일치
  - 여러 필드 동시 검색 (vehicle_name, brand_name, model_name 등)

### 검색 예시
- "아반떼" → "dkqksEp", "어반떼", "아반띄", "아반ㄸ" 등도 검색됨
- 모든 차량에 동일하게 적용

## ⚠️ 주의사항

1. **MongoDB 의존성 제거**: `@nestjs/mongoose`는 다른 기능에서 사용할 수 있으므로 제거하지 않았습니다. 필요시 제거 가능합니다.

2. **환경 변수**: Elasticsearch URL은 환경 변수로 설정 가능하며, 기본값은 Kubernetes 서비스 이름입니다.

3. **에러 처리**: Elasticsearch 연결 실패 시 빈 배열을 반환합니다. 필요시 로깅 강화 가능합니다.

## 📊 검증

동기화 완료 확인:
```bash
kubectl exec -n apc-ek-ns elasticsearch-0 -- curl -s "http://localhost:9200/vehicles/_count"
# 결과: {"count":475,"_shards":{"total":1,"successful":1,"skipped":0,"failed":0}}
```

Elasticsearch 검색 테스트:
```bash
kubectl exec -n apc-ek-ns elasticsearch-0 -- curl -s -X POST "http://localhost:9200/vehicles/_search" -H 'Content-Type: application/json' -d '{"query": {"multi_match": {"query": "아반떼", "fields": ["vehicle_name", "vehicle_name.fuzzy"], "fuzziness": "AUTO"}}, "size": 5}'
```

---

**마이그레이션 준비 완료**: 코드 변경 완료, 의존성 설치 및 배포만 남았습니다.

