# Strimzi & EK (Elasticsearch + Kibana) 역할 및 도입 타당성 분석

## 📊 현재 환경 현황

### 1. Strimzi (Kafka 운영자)

#### 현재 상태
- **네임스페이스**: `apc-striming-ns`
- **Kafka 클러스터**: `kafka-cluster` (Kafka 4.1.1)
- **Strimzi Operator**: CrashLoopBackOff 상태 (⚠️ 문제 발생)
- **Kafka 브로커**: Running (단일 브로커)
- **Storage**: Ephemeral (임시 저장소)
- **토픽**: 4개 (danawa-crawl-images, danawa-crawl-options, danawa-crawl-reviews, danawa-crawl-specifications)
- **사용 서비스**: Crawler

#### 리소스 사용량
- **Kafka 브로커**: CPU 250m-500m, Memory 512Mi-1Gi
- **Strimzi Operator**: CPU 200m, Memory 512Mi

---

### 2. EK (Elasticsearch + Kibana)

#### 현재 상태
- **네임스페이스**: `apc-ek-ns`
- **Elasticsearch**: StatefulSet (1 replica) - Running
- **Kibana**: Deployment (1 replica) - Running
- **Monstache**: MongoDB → Elasticsearch 실시간 동기화 - Running
- **리소스**: CPU 500m-1, Memory 1Gi-2Gi

#### 사용 목적
- **검색 백엔드**: 유사어 검색 기능 (MongoDB → Elasticsearch 마이그레이션 예정)
- **동기화**: MongoDB 컬렉션을 Elasticsearch 인덱스로 실시간 동기화
- **인덱스**: `vehicles` (차량 데이터)

---

## 🎯 역할 분석

### Strimzi의 역할

#### 1. **비동기 메시징 시스템**
- **용도**: 크롤러 데이터 수집 파이프라인
- **토픽별 역할**:
  - `danawa-crawl-images`: 이미지 데이터 수집
  - `danawa-crawl-options`: 옵션 데이터 수집
  - `danawa-crawl-reviews`: 리뷰 데이터 수집
  - `danawa-crawl-specifications`: 스펙 데이터 수집

#### 2. **데이터 버퍼링**
- 크롤러가 수집한 데이터를 Kafka에 저장
- 백엔드 서비스가 비동기로 소비하여 처리
- 트래픽 피크 시 부하 분산

#### 3. **현재 문제점**
- ⚠️ **Strimzi Operator가 CrashLoopBackOff**: Operator가 정상 작동하지 않음
- ⚠️ **단일 브로커**: 고가용성 없음
- ⚠️ **Ephemeral Storage**: Pod 재시작 시 데이터 손실
- ⚠️ **Replication Factor 1**: 데이터 복제 없음

---

### EK (Elasticsearch + Kibana)의 역할

#### 1. **고급 검색 엔진**
- **용도**: 차량 검색 기능 (유사어 검색, 전문 검색)
- **장점**:
  - MongoDB보다 빠른 전문 검색
  - 유사어 자동 매칭
  - 복합 쿼리 최적화

#### 2. **로그 수집 및 분석** (현재 미사용)
- Kibana를 통한 로그 시각화 가능
- Elasticsearch에 로그 저장 및 분석
- 현재는 Grafana Alloy + OpenTelemetry 사용 중

#### 3. **데이터 동기화**
- Monstache를 통한 MongoDB → Elasticsearch 실시간 동기화
- 검색 백엔드가 Elasticsearch를 통해 빠른 검색 제공

---

## 💡 도입 타당성 분석

### Strimzi 도입 타당성

#### ✅ **도입 타당성: 중간**

**장점:**
1. **Kubernetes 네이티브**: Strimzi는 Kubernetes에서 Kafka를 쉽게 운영
2. **자동화**: Operator가 클러스터 관리 자동화
3. **확장성**: 필요 시 브로커 추가 용이
4. **현재 사용 중**: Crawler가 이미 Kafka 사용 중

**단점:**
1. **현재 문제**: Operator가 CrashLoopBackOff 상태
2. **리소스 소비**: Kafka 브로커 + Operator 리소스 필요
3. **복잡도**: Kafka 운영 지식 필요
4. **Storage 비용**: Persistent Volume 필요 (현재는 ephemeral)

**개선 필요 사항:**
- ✅ Strimzi Operator 문제 해결 (CrashLoopBackOff)
- ✅ Persistent Volume 사용 (데이터 영구 저장)
- ✅ 최소 3개 브로커로 확장 (고가용성)
- ✅ Replication Factor 3 설정

**대안:**
- **외부 Kafka 사용**: DB 서버(192.168.0.201)에 Kafka가 이미 있음
- **RabbitMQ**: 더 가벼운 메시징 시스템 (단순한 use case)
- **Redis Streams**: 간단한 스트리밍 데이터 처리

---

### EK (Elasticsearch + Kibana) 도입 타당성

#### ✅ **도입 타당성: 높음**

**장점:**
1. **검색 성능**: MongoDB보다 빠른 전문 검색
2. **유사어 검색**: 자동 유사어 매칭 기능
3. **이미 배포됨**: 현재 실행 중이며 Monstache 동기화 설정 완료
4. **확장 가능**: 필요 시 노드 추가 가능
5. **Kibana 활용**: 로그 분석 및 시각화 가능

**단점:**
1. **리소스 소비**: Elasticsearch는 메모리 집약적 (현재 1Gi-2Gi)
2. **운영 복잡도**: 인덱스 관리, 샤딩, 복제 설정 필요
3. **Storage 비용**: 데이터 증가 시 스토리지 확장 필요
4. **동기화 지연**: Monstache 동기화 지연 가능성

**현재 활용도:**
- ✅ **검색 백엔드**: Elasticsearch 통합 가이드 작성 완료
- ✅ **데이터 동기화**: Monstache 설정 완료
- ⚠️ **실제 사용**: 아직 백엔드 코드 통합 미완료

**개선 필요 사항:**
- ✅ 검색 백엔드 코드에 Elasticsearch 통합
- ✅ 인덱스 템플릿 최적화
- ✅ 모니터링 및 알림 설정
- ⚠️ Storage 확장 계획 (데이터 증가 대비)

**대안:**
- **MongoDB Atlas Search**: MongoDB 내장 검색 기능 (추가 비용)
- **Algolia/Meilisearch**: 외부 검색 서비스 (SaaS)
- **현재 MongoDB 유지**: 간단한 검색만 필요한 경우

---

## 📋 권장 사항

### Strimzi (Kafka)

#### 현재 상태: ⚠️ **개선 필요**

1. **단기 (즉시)**
   - Strimzi Operator CrashLoopBackOff 문제 해결
   - Persistent Volume으로 전환 (데이터 영구 저장)

2. **중기 (1-2개월)**
   - 브로커 3개로 확장 (고가용성)
   - Replication Factor 3 설정
   - 모니터링 및 알림 설정

3. **장기 (3-6개월)**
   - 외부 Kafka(DB 서버)와 통합 검토
   - 또는 Strimzi 완전 전환 결정

#### 도입 타당성 평가: **60/100**
- 현재 사용 중이지만 문제가 많음
- 개선 후 프로덕션 사용 가능
- 또는 외부 Kafka 활용 검토

---

### EK (Elasticsearch + Kibana)

#### 현재 상태: ✅ **활용 권장**

1. **단기 (즉시)**
   - 검색 백엔드 Elasticsearch 통합 완료
   - 인덱스 데이터 동기화 확인
   - 검색 성능 테스트

2. **중기 (1-2개월)**
   - Kibana를 통한 로그 분석 활용
   - 인덱스 최적화 (샤딩, 복제)
   - 모니터링 대시보드 구성

3. **장기 (3-6개월)**
   - 노드 확장 (필요 시)
   - 백업 및 복구 전략 수립
   - 성능 튜닝

#### 도입 타당성 평가: **85/100**
- 이미 배포되어 있고 동기화 설정 완료
- 검색 기능 향상에 직접적 기여
- 리소스 투자 대비 효과 높음

---

## 💰 비용 분석

### Strimzi (Kafka)
- **현재 리소스**: CPU 250m-500m, Memory 512Mi-1Gi
- **개선 후 예상**: CPU 1-2, Memory 2-4Gi (3 브로커)
- **Storage**: Persistent Volume 10-50Gi (토픽 데이터량에 따라)

### EK (Elasticsearch + Kibana)
- **현재 리소스**: CPU 500m-1, Memory 1Gi-2Gi
- **Storage**: Persistent Volume 20-100Gi (인덱스 데이터량에 따라)
- **추가 비용**: 없음 (오픈소스)

---

## 🎯 최종 결론

### Strimzi
- **현재**: 문제가 많아 개선 필요
- **권장**: Operator 문제 해결 후 Persistent Volume 전환
- **대안**: 외부 Kafka(DB 서버) 활용 검토

### EK (Elasticsearch + Kibana)
- **현재**: 정상 작동 중, 활용 준비 완료
- **권장**: 검색 백엔드 통합 완료 후 적극 활용
- **추가 활용**: Kibana를 통한 로그 분석 도입 검토

---

**작성일**: 2025-12-24  
**분석 대상**: apc-striming-ns (Strimzi), apc-ek-ns (EK)








