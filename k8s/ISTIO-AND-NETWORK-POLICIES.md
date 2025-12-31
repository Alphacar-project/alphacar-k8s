# Istio AuthorizationPolicy 및 NetworkPolicy 정리

## Istio AuthorizationPolicy

| NS | name | Key | Value | Rules | 설명 |
|---|---|---|---|---|---|
| apc-be-ns | aichat-backend-authz-policy | app | aichat-backend | ALLOW: Istio Gateway, apc-fe-ns, apc-be-ns → 포트 4000 | AI 채팅 백엔드 접근 제어. Istio Ingress Gateway, 프론트엔드 네임스페이스, 백엔드 네임스페이스에서 포트 4000 접근 허용 |
| apc-be-ns | backend-egress-authz-policy | component | backend | ALLOW: apc-db-ns (27017, 3306, 6379), apc-obsv-ns (4317, 4318) | 백엔드 서비스의 아웃바운드 트래픽 제어. 데이터베이스(MySQL, MongoDB, Redis) 및 관찰성(OpenTelemetry) 포트만 허용 |
| apc-be-ns | community-backend-authz-policy | app | community-backend | ALLOW: Istio Gateway, apc-fe-ns, apc-be-ns → 포트 3005 | 커뮤니티 백엔드 접근 제어. Istio Gateway, 프론트엔드, 백엔드 네임스페이스에서 포트 3005 접근 허용 |
| apc-be-ns | news-backend-authz-policy | app | news-backend | ALLOW: Istio Gateway, apc-fe-ns, apc-be-ns → 포트 3008 | 뉴스 백엔드 접근 제어. Istio Gateway, 프론트엔드, 백엔드 네임스페이스에서 포트 3008 접근 허용 |
| apc-be-ns | quote-backend-authz-policy | app | quote-backend | ALLOW: Istio Gateway, apc-fe-ns, apc-be-ns → 포트 3003 | 견적 백엔드 접근 제어. Istio Gateway, 프론트엔드, 백엔드 네임스페이스에서 포트 3003 접근 허용 |
| apc-be-ns | search-backend-authz-policy | app | search-backend | ALLOW: Istio Gateway, apc-fe-ns, apc-be-ns → 포트 3007 | 검색 백엔드 접근 제어. Istio Gateway, 프론트엔드, 백엔드 네임스페이스에서 포트 3007 접근 허용 |
| apc-db-ns | database-authz-policy | component | database | ALLOW: apc-be-ns, apc-db-ns, apc-ek-ns(Monstache), apc-striming-ns(Kafka) → 포트 27017, 3306, 6379 | 데이터베이스 접근 제어. 백엔드, 데이터베이스, Elasticsearch(Monstache), Kafka 네임스페이스에서 MongoDB(27017), MySQL(3306), Redis(6379) 포트 접근 허용 |

## Kubernetes NetworkPolicy

| NS | name | policyTypes | Key | Value | Rules | 설명 |
|---|---|---|---|---|---|---|
| apc-db-ns | database-strict-policy | Ingress, Egress | component | database | **Ingress**: apc-be-ns → 포트 27017(TCP), 6379(TCP), apc-db-ns → 포트 27017(TCP), apc-ek-ns(Monstache) → 포트 27017(TCP), apc-striming-ns(Kafka) → 포트 27017(TCP)<br>**Egress**: DNS(53/UDP), apc-db-ns → 포트 27017(TCP) | 데이터베이스 네트워크 격리 정책. 백엔드, Monstache, Kafka에서 MongoDB 접근 허용. 외부 네트워크 접근 차단. Egress는 DNS 및 동일 네임스페이스 내 MongoDB 통신만 허용 |
| apc-striming-ns | kafka-cluster-network-policy-kafka | Ingress | strimzi.io/cluster, strimzi.io/kind, strimzi.io/name | kafka-cluster, Kafka, kafka-cluster-kafka | **Ingress**: Kafka 클러스터 내부 Pod → 포트 9090, 9091, 8443, 9092, 9093(TCP) | Kafka 클러스터 네트워크 정책. Strimzi Operator가 자동 생성. Kafka 브로커 간 통신 및 클러스터 운영자 접근만 허용 |

---

## 상세 설명

### Istio AuthorizationPolicy

#### 1. 백엔드 서비스 인그레스 정책 (Ingress)
- **aichat-backend-authz-policy**: AI 채팅 서비스 전용
- **community-backend-authz-policy**: 커뮤니티 서비스 전용
- **news-backend-authz-policy**: 뉴스 서비스 전용
- **quote-backend-authz-policy**: 견적 서비스 전용
- **search-backend-authz-policy**: 검색 서비스 전용

**공통 특징:**
- Istio Ingress Gateway에서의 접근 허용
- 프론트엔드 네임스페이스(apc-fe-ns)에서의 접근 허용
- 백엔드 네임스페이스(apc-be-ns) 내부 통신 허용
- 각 서비스의 고유 포트로 접근 제한

#### 2. 백엔드 이그레스 정책 (Egress)
- **backend-egress-authz-policy**: 모든 백엔드 서비스(component=backend)에 적용
- 데이터베이스 네임스페이스(apc-db-ns)로의 트래픽만 허용
- 관찰성 네임스페이스(apc-obsv-ns)로의 메트릭 전송 허용
- 허용 포트: MongoDB(27017), MySQL(3306), Redis(6379), OpenTelemetry(4317, 4318)

#### 3. 데이터베이스 접근 정책
- **database-authz-policy**: 데이터베이스 컴포넌트(component=database)에 적용
- 백엔드 네임스페이스(apc-be-ns)에서의 접근 허용
- 데이터베이스 네임스페이스(apc-db-ns) 내부 통신 허용
- Elasticsearch 네임스페이스(apc-ek-ns)에서 Monstache가 MongoDB 접근 허용
- Kafka 네임스페이스(apc-striming-ns)에서 Kafka/Crawler가 MongoDB 접근 허용
- 허용 포트: MongoDB(27017), MySQL(3306), Redis(6379)

### Kubernetes NetworkPolicy

#### 1. 데이터베이스 격리 정책
- **database-strict-policy**: 데이터베이스 컴포넌트에 적용
- **Ingress 규칙:**
  - 백엔드 네임스페이스에서 MongoDB(27017) 및 Redis(6379) 접근 허용
  - 데이터베이스 네임스페이스 내부 MongoDB 복제 통신 허용
  - Elasticsearch 네임스페이스(apc-ek-ns)에서 Monstache가 MongoDB(27017) 접근 허용
  - Kafka 네임스페이스(apc-striming-ns)에서 Kafka/Crawler가 MongoDB(27017) 접근 허용
- **Egress 규칙:**
  - DNS 조회(53/UDP) 허용 (모든 네임스페이스)
  - 동일 네임스페이스 내 MongoDB 통신(27017/TCP) 허용
- **보안 효과:** 데이터베이스로의 불필요한 접근 차단 및 데이터 유출 방지, 필요한 서비스(Monstache, Kafka)만 허용

#### 2. Kafka 클러스터 정책
- **kafka-cluster-network-policy-kafka**: Strimzi Operator가 자동 생성
- Kafka 브로커 Pod에 적용 (strimzi.io/cluster=kafka-cluster)
- **Ingress 규칙:**
  - Kafka 클러스터 내부 Pod 간 통신 (포트 9090, 9091, 9092, 9093)
  - Strimzi Cluster Operator 접근 (포트 8443)
- **보안 효과:** Kafka 클러스터 외부에서의 무단 접근 차단

---

## 정책 적용 우선순위

1. **NetworkPolicy (Kubernetes 네이워크 레벨)**: 먼저 적용되어 Pod 간 네트워크 트래픽을 제어
2. **AuthorizationPolicy (Istio 서비스 메시 레벨)**: Service Mesh 내에서 추가적인 접근 제어 적용

이 두 정책이 함께 작동하여 다층 방어 체계를 구성합니다.

---

## ✅ 현재 허용되는 연결

### 1. MongoDB 접근 허용
다음 네임스페이스에서 MongoDB로의 접근이 정책에 의해 허용됩니다:

- **apc-ek-ns (Monstache)**: MongoDB → Elasticsearch 데이터 동기화 허용
  - NetworkPolicy: `apc-ek-ns` → MongoDB(27017) 접근 허용
  - AuthorizationPolicy: `apc-ek-ns` → MongoDB(27017), MySQL(3306), Redis(6379) 접근 허용
  - **상태**: Monstache가 MongoDB에서 데이터를 읽어 Elasticsearch로 동기화 가능

- **apc-striming-ns (Kafka)**: Kafka → MongoDB 데이터 접근 허용
  - NetworkPolicy: `apc-striming-ns` → MongoDB(27017) 접근 허용
  - AuthorizationPolicy: `apc-striming-ns` → MongoDB(27017), MySQL(3306), Redis(6379) 접근 허용
  - **상태**: Crawler 및 Kafka Consumer/Producer가 MongoDB에 접근 가능

### 2. Elasticsearch 접근
- **Monstache → Elasticsearch**: 같은 네임스페이스(apc-ek-ns)이므로 정책 없이도 통신 가능
  - NetworkPolicy: apc-ek-ns에 없음 → 기본 허용
  - AuthorizationPolicy: apc-ek-ns에 없음 → 기본 허용
  - **결론**: 같은 네임스페이스에 있어 기본적으로 허용되며, 데이터 싱크가 정상 작동 가능

