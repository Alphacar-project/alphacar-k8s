# Elasticsearch 검색 백엔드 가이드

## 개요

Elasticsearch는 검색 백엔드에서 차량 검색 시 한글 유사어 검색을 지원합니다.
예: "아반떼" 검색 시 "dkqksEp", "어반떼", "아반띄", "아반ㄸ" 등도 검색됩니다.

## 구성

- **네임스페이스**: `apc-ek-ns`
- **Elasticsearch Service**: `http://elasticsearch.apc-ek-ns.svc.cluster.local:9200`
- **Kibana Service**: `http://kibana.apc-ek-ns.svc.cluster.local:5601`
- **Monstache**: MongoDB → Elasticsearch 실시간 동기화
- **스토리지**: PV/PVC 없이 ephemeral storage 사용

## 인덱스 구조

### 인덱스명
- `vehicles`: 차량 데이터 인덱스

### 주요 필드
- `vehicle_name`: 차량명 (유사어 검색 지원)
- `brand_name`: 브랜드명 (유사어 검색 지원)
- `model_name`: 모델명 (유사어 검색 지원)
- `trim_name`: 트림명 (유사어 검색 지원)
- `model_id`: 모델 ID (keyword)
- `lineup_id`: 라인업 ID (keyword)

### 검색 필드 타입
각 텍스트 필드는 다음 서브 필드를 제공합니다:
- `{field}`: 기본 검색 필드 (korean_fuzzy_analyzer 사용)
- `{field}.keyword`: 정확한 일치 검색
- `{field}.ngram`: 부분 일치 검색
- `{field}.fuzzy`: 유사어 검색

## 검색 쿼리 예시

### 1. 기본 유사어 검색 (추천)

```json
{
  "query": {
    "multi_match": {
      "query": "아반떼",
      "fields": ["vehicle_name", "vehicle_name.ngram", "vehicle_name.fuzzy"],
      "type": "best_fields",
      "fuzziness": "AUTO"
    }
  }
}
```

### 2. 한글 자판 오타 허용 검색

```json
{
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "vehicle_name": {
              "query": "dkqksEp",
              "fuzziness": "AUTO"
            }
          }
        },
        {
          "match": {
            "vehicle_name.ngram": "dkqksEp"
          }
        }
      ],
      "minimum_should_match": 1
    }
  }
}
```

### 3. 복합 검색 (차량명 + 브랜드)

```json
{
  "query": {
    "bool": {
      "should": [
        {
          "multi_match": {
            "query": "아반떼",
            "fields": ["vehicle_name^3", "brand_name^2", "model_name"],
            "type": "best_fields",
            "fuzziness": "AUTO"
          }
        }
      ]
    }
  }
}
```

### 4. 정확한 일치 + 유사어 검색 조합

```json
{
  "query": {
    "bool": {
      "should": [
        {
          "match": {
            "vehicle_name.keyword": "아반떼"
          }
        },
        {
          "match": {
            "vehicle_name.fuzzy": {
              "query": "아반떼",
              "fuzziness": "AUTO"
            }
          }
        }
      ],
      "minimum_should_match": 1
    }
  }
}
```

## 백엔드 연동 방법

### 1. Elasticsearch 클라이언트 설정

#### Node.js (Elasticsearch.js)
```javascript
const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: 'http://elasticsearch.apc-ek-ns.svc.cluster.local:9200'
});
```

#### Python (elasticsearch-py)
```python
from elasticsearch import Elasticsearch

es = Elasticsearch(['http://elasticsearch.apc-ek-ns.svc.cluster.local:9200'])
```

### 2. 검색 API 구현 예시 (Node.js)

```javascript
async function searchVehicles(query) {
  const response = await client.search({
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
            'model_name'
          ],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      },
      size: 20
    }
  });
  
  return response.body.hits.hits.map(hit => hit._source);
}
```

### 3. 검색 API 구현 예시 (Python)

```python
def search_vehicles(query):
    response = es.search(
        index='vehicles',
        body={
            'query': {
                'multi_match': {
                    'query': query,
                    'fields': [
                        'vehicle_name^3',
                        'vehicle_name.ngram^2',
                        'vehicle_name.fuzzy',
                        'brand_name^2',
                        'model_name'
                    ],
                    'type': 'best_fields',
                    'fuzziness': 'AUTO'
                }
            },
            'size': 20
        }
    )
    
    return [hit['_source'] for hit in response['hits']['hits']]
```

## 검색 기능 설명

### 1. N-gram 분석기
- 1~3글자 단위로 토큰화하여 부분 일치 검색 지원
- 예: "아반떼" → "아", "아반", "반떼", "떼" 등으로 검색 가능

### 2. Fuzzy Matching
- 오타 허용 검색 (Levenshtein distance 기반)
- 예: "아반떼" → "어반떼", "아반띄" 등 검색 가능

### 3. 한글 자모 필터
- 한글 자모 단위로 토큰화하여 오타 허용
- 예: "아반떼" → "아반ㄸ", "아반떼" 등 검색 가능

## 주의사항

1. **한글 자판 오타 검색**: "dkqksEp" 같은 한글 자판 오타 검색을 완벽하게 지원하려면 한글 자모 분리 플러그인이 필요할 수 있습니다. 현재 설정으로는 ngram과 fuzzy matching으로 어느 정도 지원됩니다.

2. **인덱스 재생성**: 템플릿 변경 후 기존 인덱스에 적용하려면 인덱스를 재생성해야 합니다.

3. **성능**: ngram과 fuzzy matching은 인덱스 크기를 증가시킬 수 있으므로 필요한 필드에만 적용하세요.

## Kibana 대시보드

Kibana는 `apc-ek-ns` 네임스페이스에서 실행되며, 데이터 대시보드 서비스를 위해 사용됩니다.

- **접속 URL**: `http://kibana.apc-ek-ns.svc.cluster.local:5601`
- **용도**: 데이터 시각화 및 분석

## Monstache 동기화

Monstache가 MongoDB의 다음 컬렉션들을 Elasticsearch에 실시간으로 동기화합니다:

- `triple_db.danawa_vehicle_data`
- `triple_db.danawa_vehicle_data2`
- `triple_db.danawa_vehicle_data3`
- `triple_db.vehicles`
- `triple_db.vehicles_unified`
- `triple_db.vehicletrims`
- `triple_db.carbar_vehicles`

## 문제 해결

### 인덱스가 생성되지 않는 경우
1. Monstache 로그 확인: `kubectl logs -n apc-ek-ns deployment/monstache`
2. Elasticsearch 연결 확인: `kubectl exec -n apc-ek-ns elasticsearch-0 -- curl http://localhost:9200`

### 검색 결과가 나오지 않는 경우
1. 인덱스에 데이터가 있는지 확인: `GET /vehicles/_count`
2. 검색 쿼리 필드명 확인
3. 분석기 설정 확인: `GET /vehicles/_mapping`

## 참고

- Elasticsearch 공식 문서: https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html
- Monstache 문서: https://rwynn.github.io/monstache-site/

