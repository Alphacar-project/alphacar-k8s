# 검색 백엔드 MongoDB → Elasticsearch 마이그레이션 가이드

## 현재 상황

- **검색 백엔드**: `apc-be-ns` 네임스페이스의 `search-backend` Deployment
- **현재 데이터 소스**: MongoDB (`triple_db.danawa_vehicle_data`)
- **목표 데이터 소스**: Elasticsearch (`vehicles` 인덱스)
- **MongoDB 문서 수**: 475개
- **Elasticsearch 인덱스 문서 수**: 2개 (동기화 진행 중)

## 1. Monstache 데이터 동기화 설정

### 현재 상태
- Monstache가 MongoDB → Elasticsearch 실시간 동기화 중
- 일부 문서 파싱 오류 발생 (타입 불일치)
- 동기화 설정 업데이트 완료

### 동기화 컬렉션
- `triple_db.danawa_vehicle_data` → `vehicles` 인덱스
- `triple_db.danawa_vehicle_data2` → `vehicles` 인덱스
- `triple_db.danawa_vehicle_data3` → `vehicles` 인덱스
- `triple_db.vehicles` → `vehicles` 인덱스
- `triple_db.vehicles_unified` → `vehicles` 인덱스
- `triple_db.vehicletrims` → `vehicles` 인덱스
- `triple_db.carbar_vehicles` → `vehicles` 인덱스

### 동기화 확인 방법
```bash
# Elasticsearch 문서 수 확인
kubectl exec -n apc-ek-ns elasticsearch-0 -- curl -s "http://localhost:9200/vehicles/_count"

# Monstache 로그 확인
kubectl logs -n apc-ek-ns deployment/monstache --tail=50
```

## 2. 검색 백엔드 코드 변경

### 2.1 Elasticsearch 클라이언트 설치

#### Node.js (NestJS)
```bash
npm install @elastic/elasticsearch
```

### 2.2 Elasticsearch 서비스 생성

**파일**: `src/elasticsearch/elasticsearch.service.ts`

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch.apc-ek-ns.svc.cluster.local:9200',
    });
  }

  async onModuleInit() {
    // 연결 테스트
    try {
      const health = await this.client.cluster.health();
      console.log('Elasticsearch 연결 성공:', health.status);
    } catch (error) {
      console.error('Elasticsearch 연결 실패:', error);
    }
  }

  getClient(): Client {
    return this.client;
  }
}
```

### 2.3 검색 서비스 변경

**기존 MongoDB 코드**:
```typescript
// MongoDB 사용
const vehicles = await this.vehicleModel.find({
  $or: [
    { vehicle_name: { $regex: query, $options: 'i' } },
    { brand_name: { $regex: query, $options: 'i' } }
  ]
});
```

**변경된 Elasticsearch 코드**:
```typescript
// Elasticsearch 사용
async searchVehicles(query: string, page: number = 1, limit: number = 20) {
  const from = (page - 1) * limit;
  
  const response = await this.elasticsearchService.getClient().search({
    index: 'vehicles',
    body: {
      query: {
        multi_match: {
          query: query,
          fields: [
            'vehicle_name^3',
            'vehicle_name.ngram^2',
            'vehicle_name.fuzzy',
            'brand_name^2',
            'model_name',
            'trim_name'
          ],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      },
      from,
      size: limit,
      _source: [
        'vehicle_name',
        'vehicle_name_full',
        'brand_name',
        'model_name',
        'model_id',
        'lineup_id',
        'main_image',
        'logo_url',
        'fuel_type',
        'model_year'
      ]
    }
  });

  return {
    total: response.body.hits.total.value,
    vehicles: response.body.hits.hits.map(hit => hit._source),
    page,
    limit
  };
}
```

### 2.4 환경 변수 설정

**ConfigMap 또는 환경 변수 추가**:
```yaml
env:
  - name: ELASTICSEARCH_URL
    value: "http://elasticsearch.apc-ek-ns.svc.cluster.local:9200"
  - name: ELASTICSEARCH_INDEX
    value: "vehicles"
```

### 2.5 모듈 등록

**파일**: `src/app.module.ts` 또는 검색 모듈
```typescript
import { ElasticsearchService } from './elasticsearch/elasticsearch.service';

@Module({
  providers: [ElasticsearchService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}
```

## 3. 마이그레이션 체크리스트

### 3.1 데이터 동기화 확인
- [ ] Monstache 로그에서 오류 없는지 확인
- [ ] Elasticsearch 인덱스 문서 수가 MongoDB와 비슷한지 확인
- [ ] 샘플 데이터 검색 테스트

### 3.2 검색 백엔드 변경
- [ ] Elasticsearch 클라이언트 설치
- [ ] Elasticsearch 서비스 생성
- [ ] 검색 로직 MongoDB → Elasticsearch 변경
- [ ] 환경 변수 설정
- [ ] 모듈 등록

### 3.3 테스트
- [ ] 기본 검색 테스트
- [ ] 한글 유사어 검색 테스트 ("아반떼" → "dkqksEp", "어반떼" 등)
- [ ] 페이징 테스트
- [ ] 성능 테스트

### 3.4 배포
- [ ] 검색 백엔드 이미지 빌드
- [ ] Deployment 업데이트
- [ ] 롤아웃 확인

## 4. 검색 쿼리 예시

### 4.1 기본 검색
```typescript
{
  query: {
    multi_match: {
      query: "아반떼",
      fields: ["vehicle_name^3", "vehicle_name.ngram^2", "vehicle_name.fuzzy"],
      type: "best_fields",
      fuzziness: "AUTO"
    }
  }
}
```

### 4.2 필터링 포함 검색
```typescript
{
  query: {
    bool: {
      must: [
        {
          multi_match: {
            query: "아반떼",
            fields: ["vehicle_name", "brand_name"],
            fuzziness: "AUTO"
          }
        }
      ],
      filter: [
        { term: { fuel_type: "전기" } },
        { term: { is_active: true } }
      ]
    }
  }
}
```

### 4.3 정렬 포함 검색
```typescript
{
  query: { ... },
  sort: [
    { _score: { order: "desc" } },
    { model_year: { order: "desc" } }
  ]
}
```

## 5. 문제 해결

### 5.1 Monstache 동기화 오류
- **증상**: 일부 문서 파싱 오류
- **해결**: Elasticsearch 인덱스 매핑을 동적으로 허용하도록 설정
- **명령어**: 
  ```bash
  kubectl exec -n apc-ek-ns elasticsearch-0 -- curl -s -X PUT "http://localhost:9200/vehicles/_settings" -H 'Content-Type: application/json' -d '{"index.mapping.total_fields.limit": 2000}'
  ```

### 5.2 검색 결과 없음
- **확인**: 인덱스에 데이터가 있는지 확인
- **확인**: 필드명이 정확한지 확인
- **확인**: 분석기 설정이 올바른지 확인

### 5.3 성능 이슈
- **확인**: 인덱스 크기 모니터링
- **확인**: 쿼리 최적화
- **확인**: 캐싱 적용 고려

## 6. 롤백 계획

만약 문제가 발생하면:
1. 검색 백엔드를 이전 버전으로 롤백
2. MongoDB 검색 로직으로 복구
3. Elasticsearch 문제 해결 후 재배포

## 7. 참고 자료

- Elasticsearch 검색 가이드: `ELASTICSEARCH-SEARCH-GUIDE.md`
- Elasticsearch 검증 보고서: `elasticsearch-validation-report.md`
- Monstache 설정: `monstache-deployment.yaml`

---

**다음 단계**: 
1. Monstache 동기화 완료 대기
2. 검색 백엔드 코드 변경
3. 테스트 및 배포

