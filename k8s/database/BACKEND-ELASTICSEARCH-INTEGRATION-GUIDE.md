# 백엔드 Elasticsearch 통합 가이드

## 📋 개요

Elasticsearch를 통한 유사어 검색 기능을 구현하기 위한 백엔드 통합 가이드입니다.

**현재 인프라 상태:**
- ✅ Elasticsearch: `apc-ek-ns` 네임스페이스에 배포 완료
- ✅ Monstache: MongoDB와 Elasticsearch 실시간 동기화 설정 완료
- ✅ Kibana: 모니터링 및 관리 UI 배포 완료
- ✅ 인덱스 템플릿: 유사어 검색을 위한 템플릿 적용 완료

**서비스 정보:**
- **Elasticsearch URL**: `http://elasticsearch.apc-ek-ns.svc.cluster.local:9200`
- **인덱스명**: `vehicles`
- **동기화 컬렉션**: `triple_db.danawa_vehicle_data`

---

## 🚀 백엔드 구현 단계

### 1단계: 의존성 추가

#### Node.js (package.json)
```json
{
  "dependencies": {
    "@elastic/elasticsearch": "^8.11.0"
  }
}
```

#### Python (requirements.txt)
```
elasticsearch==8.11.0
```

---

### 2단계: 환경 변수 설정

#### Kubernetes ConfigMap 또는 .env 파일
```yaml
# ConfigMap 예시
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: <your-backend-namespace>
data:
  ELASTICSEARCH_URL: "http://elasticsearch.apc-ek-ns.svc.cluster.local:9200"
  ELASTICSEARCH_INDEX: "vehicles"
```

또는 `.env` 파일:
```
ELASTICSEARCH_URL=http://elasticsearch.apc-ek-ns.svc.cluster.local:9200
ELASTICSEARCH_INDEX=vehicles
```

---

### 3단계: Elasticsearch 클라이언트 초기화

#### Node.js
```javascript
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch.apc-ek-ns.svc.cluster.local:9200',
  requestTimeout: 30000,
});

// 연결 테스트
async function testConnection() {
  try {
    const response = await esClient.ping();
    console.log('Elasticsearch 연결 성공');
    return true;
  } catch (error) {
    console.error('Elasticsearch 연결 실패:', error);
    return false;
  }
}
```

#### Python
```python
from elasticsearch import Elasticsearch
import os

es_client = Elasticsearch(
    [os.getenv('ELASTICSEARCH_URL', 'http://elasticsearch.apc-ek-ns.svc.cluster.local:9200')],
    request_timeout=30
)

# 연결 테스트
def test_connection():
    try:
        if es_client.ping():
            print('Elasticsearch 연결 성공')
            return True
        return False
    except Exception as e:
        print(f'Elasticsearch 연결 실패: {e}')
        return False
```

---

### 4단계: 유사어 검색 쿼리 구현

#### 검색 전략
인덱스 템플릿에 설정된 필드별 검색 전략:

1. **정확한 매칭** (`vehicle_name.keyword`): 우선순위 3.0
2. **Fuzzy 검색** (`vehicle_name`): 우선순위 2.0 - 오타 교정
3. **N-gram 검색** (`vehicle_name.ngram`): 우선순위 1.5 - 부분 일치, 자모 분리 검색
4. **와일드카드 검색** (`vehicle_name.exact`): 우선순위 1.2 - 부분 문자열 매칭

#### Node.js 구현 예시
```javascript
async function searchVehicles(query) {
  if (!query || query.trim() === '') {
    return [];
  }

  const searchQuery = {
    index: process.env.ELASTICSEARCH_INDEX || 'vehicles',
    body: {
      query: {
        bool: {
          should: [
            // 정확한 매칭 (높은 점수)
            {
              match: {
                'vehicle_name.keyword': {
                  query: query,
                  boost: 3.0
                }
              }
            },
            // 유사어 검색 (fuzzy)
            {
              match: {
                vehicle_name: {
                  query: query,
                  fuzziness: 'AUTO',
                  boost: 2.0
                }
              }
            },
            // N-gram 검색 (부분 일치, 자모 분리 검색 지원)
            {
              match: {
                'vehicle_name.ngram': {
                  query: query,
                  boost: 1.5
                }
              }
            },
            // 와일드카드 검색 (부분 문자열 매칭)
            {
              wildcard: {
                'vehicle_name.exact': {
                  value: `*${query}*`,
                  boost: 1.2
                }
              }
            }
          ],
          minimum_should_match: 1
        }
      },
      size: 50  // 최대 결과 수
    }
  };

  try {
    const result = await esClient.search(searchQuery);
    return result.hits.hits.map(hit => ({
      ...hit._source,
      score: hit._score
    }));
  } catch (error) {
    console.error('검색 오류:', error);
    throw error;
  }
}
```

#### Python 구현 예시
```python
def search_vehicles(query):
    if not query or not query.strip():
        return []

    search_query = {
        "query": {
            "bool": {
                "should": [
                    {
                        "match": {
                            "vehicle_name.keyword": {
                                "query": query,
                                "boost": 3.0
                            }
                        }
                    },
                    {
                        "match": {
                            "vehicle_name": {
                                "query": query,
                                "fuzziness": "AUTO",
                                "boost": 2.0
                            }
                        }
                    },
                    {
                        "match": {
                            "vehicle_name.ngram": {
                                "query": query,
                                "boost": 1.5
                            }
                        }
                    },
                    {
                        "wildcard": {
                            "vehicle_name.exact": {
                                "value": f"*{query}*",
                                "boost": 1.2
                            }
                        }
                    }
                ],
                "minimum_should_match": 1
            }
        },
        "size": 50
    }

    try:
        result = es_client.search(
            index=os.getenv('ELASTICSEARCH_INDEX', 'vehicles'),
            body=search_query
        )
        return [
            {**hit['_source'], 'score': hit['_score']}
            for hit in result['hits']['hits']
        ]
    except Exception as e:
        print(f'검색 오류: {e}')
        raise
```

---

### 5단계: 검색 API 엔드포인트 구현

#### Express.js 예시
```javascript
const express = require('express');
const router = express.Router();

router.get('/api/search/vehicles', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        error: '검색어가 필요합니다',
        query: null,
        count: 0,
        results: []
      });
    }

    const results = await searchVehicles(q);
    
    res.json({
      query: q,
      count: results.length,
      results: results.map(item => ({
        vehicle_name: item.vehicle_name,
        brand_name: item.brand_name,
        model_id: item.model_id,
        lineup_id: item.lineup_id,
        score: item.score
      }))
    });
  } catch (error) {
    console.error('검색 API 오류:', error);
    res.status(500).json({ 
      error: '검색 중 오류가 발생했습니다',
      message: error.message 
    });
  }
});

module.exports = router;
```

#### Flask 예시
```python
from flask import Flask, request, jsonify

@app.route('/api/search/vehicles', methods=['GET'])
def search_vehicles_endpoint():
    try:
        query = request.args.get('q')
        
        if not query:
            return jsonify({
                'error': '검색어가 필요합니다',
                'query': None,
                'count': 0,
                'results': []
            }), 400

        results = search_vehicles(query)
        
        return jsonify({
            'query': query,
            'count': len(results),
            'results': [
                {
                    'vehicle_name': item['vehicle_name'],
                    'brand_name': item['brand_name'],
                    'model_id': item['model_id'],
                    'lineup_id': item['lineup_id'],
                    'score': item['score']
                }
                for item in results
            ]
        })
    except Exception as e:
        print(f'검색 API 오류: {e}')
        return jsonify({
            'error': '검색 중 오류가 발생했습니다',
            'message': str(e)
        }), 500
```

---

### 6단계: 에러 처리 및 대체 로직

Elasticsearch 연결 실패 시 MongoDB로 대체 검색을 구현하는 것을 권장합니다.

#### Node.js 예시
```javascript
async function searchVehiclesWithFallback(query) {
  try {
    // Elasticsearch 검색 시도
    return await searchVehicles(query);
  } catch (error) {
    console.error('Elasticsearch 검색 실패, MongoDB로 대체:', error);
    
    // MongoDB로 대체 검색 (기본 검색)
    const mongoClient = require('./mongo-client'); // MongoDB 클라이언트
    return await mongoClient
      .db('triple_db')
      .collection('danawa_vehicle_data')
      .find({
        vehicle_name: { $regex: query, $options: 'i' }
      })
      .limit(50)
      .toArray();
  }
}
```

#### Python 예시
```python
def search_vehicles_with_fallback(query):
    try:
        # Elasticsearch 검색 시도
        return search_vehicles(query)
    except Exception as e:
        print(f'Elasticsearch 검색 실패, MongoDB로 대체: {e}')
        
        # MongoDB로 대체 검색 (기본 검색)
        from pymongo import MongoClient
        mongo_client = MongoClient('mongodb://...')  # MongoDB 연결
        db = mongo_client['triple_db']
        collection = db['danawa_vehicle_data']
        
        return list(collection.find({
            'vehicle_name': {'$regex': query, '$options': 'i'}
        }).limit(50))
```

---

## 🧪 테스트 방법

### 1. Elasticsearch 연결 테스트
```bash
# Kubernetes 클러스터 내에서
curl http://elasticsearch.apc-ek-ns.svc.cluster.local:9200

# Pod 내에서 직접 테스트
kubectl exec -n apc-ek-ns elasticsearch-0 -- curl http://localhost:9200
```

### 2. 인덱스 확인
```bash
kubectl exec -n apc-ek-ns elasticsearch-0 -- curl http://localhost:9200/_cat/indices
```

### 3. 검색 테스트
```bash
kubectl exec -n apc-ek-ns elasticsearch-0 -- curl -X POST \
  "http://localhost:9200/vehicles/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "match": {
        "vehicle_name": {
          "query": "아반떼",
          "fuzziness": "AUTO"
        }
      }
    }
  }'
```

### 4. 검색 예시
다음과 같은 검색어들이 모두 "아반떼"를 찾을 수 있어야 합니다:
- `dkqksEp` (한글 자판 오타)
- `아반뜨` (오타)
- `아빤뗴` (오타)
- `어반떼` (오타)
- `아반ㄸ` (부분 입력)

---

## 📊 검색 결과 예시

### 요청
```http
GET /api/search/vehicles?q=아반떼
```

### 응답
```json
{
  "query": "아반떼",
  "count": 1,
  "results": [
    {
      "vehicle_name": "아반떼",
      "brand_name": "현대",
      "model_id": "...",
      "lineup_id": "...",
      "score": 5.234
    }
  ]
}
```

---

## ⚠️ 주의사항

### 1. 인덱스 동기화
- Monstache가 MongoDB 변경사항을 Elasticsearch에 **자동으로 동기화**합니다
- 데이터 변경 후 즉시 검색 가능하지만, 네트워크 지연으로 인해 최대 1-2초 정도 소요될 수 있습니다

### 2. 데이터 일관성
- Elasticsearch는 MongoDB의 **실시간 복사본**입니다
- 최종 데이터 소스는 **MongoDB**입니다
- 중요한 데이터 조회 시 MongoDB를 우선 사용하는 것을 권장합니다

### 3. 검색 성능
- 유사어 검색은 정확한 검색보다 느릴 수 있으므로 적절한 타임아웃 설정이 필요합니다
- 기본 타임아웃: 30초 권장

### 4. 인덱스 관리
- 인덱스는 Monstache가 자동으로 생성합니다
- 인덱스 템플릿은 이미 적용되어 있으므로 추가 설정 불필요

### 5. 스토리지
- 현재 Elasticsearch는 **PV/PVC 없이 ephemeral storage**를 사용합니다
- Pod 재시작 시 데이터가 초기화될 수 있지만, Monstache가 자동으로 재동기화합니다

---

## 🔍 모니터링

### Kibana 접근
```bash
# Port-forward를 통한 접근
kubectl port-forward -n apc-ek-ns svc/kibana 5601:5601

# 브라우저에서 접근
http://localhost:5601
```

### Monstache 로그 확인
```bash
kubectl logs -n apc-ek-ns deployment/monstache -f
```

### Elasticsearch 상태 확인
```bash
kubectl exec -n apc-ek-ns elasticsearch-0 -- curl http://localhost:9200/_cluster/health
```

---

## 📝 체크리스트

백엔드 통합 전 확인사항:

- [ ] Elasticsearch 클라이언트 라이브러리 설치
- [ ] 환경 변수 설정 (ELASTICSEARCH_URL, ELASTICSEARCH_INDEX)
- [ ] Elasticsearch 클라이언트 초기화 코드 작성
- [ ] 검색 쿼리 함수 구현
- [ ] 검색 API 엔드포인트 구현
- [ ] 에러 처리 및 대체 로직 구현
- [ ] 연결 테스트 수행
- [ ] 검색 기능 테스트 수행

---

## 🆘 문제 해결

### Elasticsearch 연결 실패
1. 네임스페이스 확인: `kubectl get svc -n apc-ek-ns`
2. Pod 상태 확인: `kubectl get pods -n apc-ek-ns`
3. 서비스 DNS 확인: `elasticsearch.apc-ek-ns.svc.cluster.local`

### 검색 결과가 없음
1. 인덱스 존재 확인: `curl http://elasticsearch.apc-ek-ns.svc.cluster.local:9200/_cat/indices`
2. Monstache 동기화 상태 확인: `kubectl logs -n apc-ek-ns deployment/monstache`
3. MongoDB 데이터 확인

### 성능 이슈
1. 검색 쿼리 최적화
2. 결과 수 제한 (size 파라미터)
3. 타임아웃 설정 조정

---

## 📞 문의

인프라 관련 문의사항이 있으시면 DevOps 팀에 문의해주세요.

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-12-23  
**작성자**: DevOps Team


