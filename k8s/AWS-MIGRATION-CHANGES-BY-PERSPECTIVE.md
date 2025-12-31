# 🔄 AWS 마이그레이션 변화점 분석 (데이터/보안/스토리지/백업 관점)

## 📋 목차
1. [데이터 관점](#데이터-관점)
2. [보안 관점](#보안-관점)
3. [스토리지 관점](#스토리지-관점)
4. [백업 관점](#백업-관점)
5. [종합 비교표](#종합-비교표)

---

## 📊 데이터 관점

### 1. MongoDB → Amazon DocumentDB

#### 현재 상태
- **구성**: StatefulSet (3 replicas), ReplicaSet (rs0)
- **관리**: 수동 백업, 수동 패치, 수동 모니터링
- **고가용성**: 수동 구성 (ReplicaSet)
- **스토리지**: Longhorn (20Gi x 3)

#### 변화점
```
MongoDB (StatefulSet)
  ↓
Amazon DocumentDB (관리형 서비스)
```

#### 변화 이유

**1. 자동 백업 및 복구**
- **현재**: 수동 백업 스크립트, Velero로 백업
- **변화**: 35일 자동 백업, Point-in-Time 복구
- **이유**: 백업 실패 위험 제거, 복구 시간 단축

**2. 자동 패치 및 업데이트**
- **현재**: 수동으로 MongoDB 버전 업데이트, 다운타임 발생
- **변화**: AWS가 자동으로 패치 적용, 유지보수 윈도우 최소화
- **이유**: 보안 취약점 빠른 패치, 운영 부담 감소

**3. 고가용성 자동 구성**
- **현재**: ReplicaSet 수동 구성, Primary 장애 시 수동 페일오버
- **변화**: Multi-AZ 자동 구성, 자동 페일오버
- **이유**: 다운타임 최소화, 고가용성 보장

**4. 모니터링 및 알람**
- **현재**: Prometheus + Grafana 수동 구성
- **변화**: CloudWatch 통합, 자동 알람
- **이유**: 운영 효율성 향상, 문제 조기 발견

**5. 코드 변경 없음**
- **현재**: Mongoose 드라이버 사용
- **변화**: 동일한 Mongoose 드라이버 사용 (100% 호환)
- **이유**: 마이그레이션 리스크 최소화

#### 비용 효과
- 하드웨어 교체 시: 74% 절감 ($1,027/월)
- 하드웨어 보유 시: 35% 절감 ($194/월)
- 인건비 절감: 90% (10시간 → 1시간/월)

---

### 2. Redis → Amazon ElastiCache

#### 현재 상태
- **구성**: Deployment (1 replica)
- **관리**: 수동 관리, 수동 페일오버
- **백업**: 수동 스냅샷

#### 변화점
```
Redis (Deployment)
  ↓
Amazon ElastiCache for Redis (관리형 서비스)
```

#### 변화 이유

**1. 자동 페일오버**
- **현재**: 단일 인스턴스, 장애 시 수동 복구
- **변화**: Multi-AZ 자동 페일오버
- **이유**: 고가용성 보장, 다운타임 제로

**2. 자동 백업**
- **현재**: 수동 스냅샷 생성
- **변화**: 자동 일일 스냅샷, Point-in-Time 복구
- **이유**: 데이터 손실 방지, 복구 시간 단축

**3. 모니터링 통합**
- **현재**: 별도 모니터링 구성
- **변화**: CloudWatch 통합
- **이유**: 운영 효율성 향상

#### 비용 효과
- 64% 절감 ($70/월)
- 인건비 절감: 75% (2시간 → 0.5시간/월)

---

### 3. Elasticsearch → Amazon OpenSearch Service

#### 현재 상태
- **구성**: StatefulSet (1 replica)
- **관리**: 수동 관리, 수동 스케일링
- **검색**: 유사어 검색 기능

#### 변화점
```
Elasticsearch (StatefulSet)
  ↓
Amazon OpenSearch Service (관리형 서비스)
```

#### 변화 이유

**1. 자동 스케일링**
- **현재**: 수동으로 Pod 수 조정
- **변화**: 트래픽에 따라 자동 확장/축소
- **이유**: 비용 최적화, 성능 보장

**2. 관리형 서비스**
- **현재**: Elasticsearch 버전 관리, 설정 관리
- **변화**: AWS가 자동 관리
- **이유**: 운영 부담 감소

**3. 보안 강화**
- **현재**: 네트워크 정책으로만 보호
- **변화**: VPC 내부 배치, IAM 통합
- **이유**: 보안 강화

#### 비용 효과
- 비용 유사하지만 운영 효율성 향상
- 인건비 절감: 50% (4시간 → 2시간/월)

---

### 4. Kafka + Strimzi → Apache Airflow

#### 현재 상태
- **구성**: Kafka 클러스터 (Strimzi Operator)
- **문제**: Strimzi Operator CrashLoopBackOff
- **사용 패턴**: 배치 작업 (스트림 아님)

#### 변화점
```
Kafka + Strimzi (메시징 큐)
  ↓
Apache Airflow (워크플로우 오케스트레이션)
```

#### 변화 이유

**1. 사용 패턴 불일치**
- **현재**: 스트림 메시징 시스템 사용
- **실제**: 배치 작업 (매주 일요일 새벽 2시)
- **이유**: 스트림 데이터가 없어 Kafka가 과함

**2. 아키텍처 단순화**
- **현재**: Producer → Kafka Topics → Consumer
- **변화**: DAG로 워크플로우 정의
- **이유**: 복잡성 감소, 관리 용이

**3. 운영 문제 해결**
- **현재**: Strimzi Operator CrashLoopBackOff
- **변화**: 안정적인 Airflow 운영
- **이유**: 안정성 향상

**4. 워크플로우 관리**
- **현재**: 작업 의존성 관리 어려움
- **변화**: DAG로 의존성 자동 관리
- **이유**: 개발 생산성 향상

#### 비용 효과
- 비용 유사하지만 운영 부담 감소
- 아키텍처 단순화로 유지보수 비용 절감

---

## 🔒 보안 관점

### 1. Sealed Secret → AWS Secrets Manager

#### 현재 상태
- **구성**: Sealed Secret (Kubernetes)
- **관리**: 수동 로테이션, 수동 감사
- **저장**: Kubernetes Secret (암호화)

#### 변화점
```
Sealed Secret (Kubernetes)
  ↓
AWS Secrets Manager (관리형 서비스)
```

#### 변화 이유

**1. 자동 로테이션**
- **현재**: 수동으로 비밀번호 변경, 애플리케이션 재시작
- **변화**: 자동 로테이션 (RDS, DocumentDB 등)
- **이유**: 보안 강화, 운영 부담 감소

**2. 감사 로그**
- **현재**: 수동으로 접근 기록 관리
- **변화**: 모든 접근 자동 로깅 (CloudTrail 통합)
- **이유**: 컴플라이언스 준수, 보안 감사

**3. IAM 통합**
- **현재**: Kubernetes RBAC만 사용
- **변화**: IAM 기반 세밀한 접근 제어
- **이유**: 보안 강화, 권한 관리 용이

**4. 버전 관리**
- **현재**: 수동 버전 관리
- **변화**: 자동 버전 관리, 이전 버전 복구 가능
- **이유**: 롤백 용이, 감사 추적

#### 비용 효과
- 71% 절감 ($71/월)
- 인건비 절감: 75% (2시간 → 0.5시간/월)

---

### 2. Kubernetes NetworkPolicy → Security Groups

#### 현재 상태
- **구성**: NetworkPolicy (L3/L4 제어)
- **관리**: 네임스페이스별 정책 관리
- **보호**: Pod 간 통신 제어

#### 변화점
```
Kubernetes NetworkPolicy
  ↓
AWS Security Groups + NetworkPolicy (하이브리드)
```

#### 변화 이유

**1. 다층 방어**
- **현재**: NetworkPolicy만 사용
- **변화**: Security Groups (VPC 레벨) + NetworkPolicy (K8s 레벨)
- **이유**: Defense in Depth, 보안 강화

**2. VPC 통합**
- **현재**: Kubernetes 네트워크만 제어
- **변화**: VPC 레벨 네트워크 격리
- **이유**: 인프라 레벨 보안 강화

**3. 관리 통합**
- **현재**: Kubernetes 리소스로만 관리
- **변화**: AWS 콘솔에서도 관리 가능
- **이유**: 운영 편의성 향상

**4. NetworkPolicy 유지**
- **이유**: Kubernetes 내부 보안은 여전히 필요
- **전략**: Security Groups + NetworkPolicy 병행

---

### 3. Istio AuthorizationPolicy → AWS App Mesh (조건부)

#### 현재 상태
- **구성**: Istio AuthorizationPolicy (L7 제어)
- **관리**: 서비스별 정책 관리
- **보호**: 서비스 간 통신 제어

#### 변화점
```
Istio AuthorizationPolicy
  ↓
AWS App Mesh (조건부) 또는 Istio 유지
```

#### 변화 이유

**옵션 A: AWS App Mesh로 전환**
- **이유**: AWS 서비스 통합, 관리 단순화
- **단점**: 기능 제한적

**옵션 B: Istio 유지 (권장)**
- **이유**: 더 많은 기능, 더 성숙한 솔루션
- **전략**: EKS에서 Istio 계속 사용

---

### 4. 보안 모니터링 강화

#### 현재 상태
- **구성**: 수동 보안 모니터링
- **도구**: Kubernetes 로그만 확인

#### 변화점
```
수동 보안 모니터링
  ↓
AWS GuardDuty + Security Hub (자동 위협 탐지)
```

#### 변화 이유

**1. 자동 위협 탐지**
- **현재**: 수동으로 로그 분석
- **변화**: GuardDuty가 자동으로 위협 탐지
- **이유**: 보안 사고 조기 발견

**2. 보안 상태 집중 관리**
- **현재**: 여러 도구로 분산 관리
- **변화**: Security Hub에서 통합 관리
- **이유**: 보안 상태 한눈에 파악

**3. 컴플라이언스 자동화**
- **현재**: 수동으로 컴플라이언스 확인
- **변화**: Config Rules로 자동 검증
- **이유**: 컴플라이언스 준수 자동화

---

## 💾 스토리지 관점

### 1. Longhorn → Amazon EBS

#### 현재 상태
- **구성**: Longhorn (분산 블록 스토리지)
- **관리**: 수동 스냅샷, 수동 복제
- **스토리지**: 약 75Gi (MongoDB, Loki, aichat-vector-store)

#### 변화점
```
Longhorn (자체 관리)
  ↓
Amazon EBS (완전 관리형)
```

#### 변화 이유

**1. 완전 관리형**
- **현재**: Longhorn Operator 관리, 스토리지 노드 관리
- **변화**: AWS가 자동으로 관리
- **이유**: 운영 부담 감소

**2. 자동 스냅샷**
- **현재**: RecurringJob으로 수동 스냅샷 생성
- **변화**: EBS 스냅샷 자동 생성 (AWS Backup)
- **이유**: 백업 자동화, 복구 시간 단축

**3. Multi-AZ 복제**
- **현재**: Longhorn 복제 설정 (수동)
- **변화**: Multi-AZ 자동 복제
- **이유**: 고가용성 보장, 데이터 손실 방지

**4. 성능 향상**
- **현재**: 네트워크 스토리지 (지연시간 높음)
- **변화**: EBS gp3 (낮은 지연시간, 높은 IOPS)
- **이유**: 성능 향상

**5. 암호화**
- **현재**: Longhorn 암호화 설정 (수동)
- **변화**: EBS 기본 암호화 (KMS 통합)
- **이유**: 보안 강화, 컴플라이언스 준수

#### 비용 효과
- 비용 거의 동일 ($150/월 → $145/월)
- 인건비 절감: 75% (2시간 → 0.5시간/월)

---

### 2. 스토리지 클래스 통합

#### 현재 상태
- **구성**: `longhorn` StorageClass
- **관리**: Longhorn UI로 관리

#### 변화점
```
longhorn StorageClass
  ↓
ebs-sc StorageClass (EBS CSI Driver)
```

#### 변화 이유

**1. 표준화**
- **현재**: Longhorn 전용 StorageClass
- **변화**: AWS 표준 EBS StorageClass
- **이유**: 표준화, 호환성 향상

**2. 동적 프로비저닝**
- **현재**: Longhorn이 동적 프로비저닝
- **변화**: EBS CSI Driver가 동적 프로비저닝
- **이유**: AWS 네이티브 통합

**3. 볼륨 확장**
- **현재**: Longhorn 볼륨 확장 (제한적)
- **변화**: EBS 볼륨 온라인 확장
- **이유**: 유연성 향상

---

## 💿 백업 관점

### 1. Velero → Velero + AWS S3 (유지 + 개선)

#### 현재 상태
- **구성**: Velero (Kubernetes 백업)
- **저장소**: S3 (mongodb-382045063773 버킷)
- **백업**: 일일 MongoDB, Kafka, 주간 전체 클러스터

#### 변화점
```
Velero (온프레미스 S3)
  ↓
Velero (AWS S3 연동) + AWS Backup (하이브리드)
```

#### 변화 이유

**1. Velero 유지 이유**
- **Kubernetes 리소스 백업**: Velero가 최적
- **네임스페이스별 백업**: 유연한 백업 전략
- **크로스 플랫폼**: 다른 클라우드로도 마이그레이션 가능
- **이미 구축됨**: 현재 설정 그대로 사용

**2. AWS S3 연동**
- **현재**: 온프레미스 S3 또는 외부 S3
- **변화**: AWS S3 직접 연동
- **이유**: AWS 서비스 통합, 비용 절감

**3. 하이브리드 접근 (추가 권장)**
- **EBS 스냅샷**: AWS Backup으로 자동 관리
- **Kubernetes 리소스**: Velero로 백업
- **이유**: 이중 백업으로 안정성 향상

#### 비용 효과
- 75% 절감 ($140/월 → $35/월)
- 인건비 절감: 75% (2시간 → 0.5시간/월)

---

### 2. Longhorn 스냅샷 → EBS 스냅샷

#### 현재 상태
- **구성**: Longhorn RecurringJob으로 스냅샷 생성
- **관리**: Longhorn UI로 관리
- **보존**: 7일

#### 변화점
```
Longhorn 스냅샷 (RecurringJob)
  ↓
EBS 스냅샷 (AWS Backup 자동 관리)
```

#### 변화 이유

**1. 자동 관리**
- **현재**: RecurringJob으로 수동 스케줄링
- **변화**: AWS Backup이 자동으로 스냅샷 생성 및 관리
- **이유**: 백업 자동화, 운영 부담 감소

**2. 라이프사이클 관리**
- **현재**: 수동으로 오래된 스냅샷 삭제
- **변화**: 자동 라이프사이클 정책 (S3로 아카이빙)
- **이유**: 비용 최적화, 장기 보관

**3. 복구 시간 단축**
- **현재**: Longhorn에서 스냅샷 복원 (수동)
- **변화**: EBS 스냅샷에서 빠른 복원
- **이유**: 복구 시간 단축

---

### 3. 백업 전략 개선

#### 현재 상태
- **MongoDB**: Velero + Longhorn 스냅샷
- **Kafka**: Velero
- **전체 클러스터**: 주간 Velero 백업

#### 변화점
```
단일 백업 전략
  ↓
하이브리드 백업 전략 (이중 백업)
```

#### 변화 이유

**1. 이중 백업**
- **EBS 스냅샷**: 인프라 레벨 백업 (AWS Backup)
- **Kubernetes 리소스**: 애플리케이션 레벨 백업 (Velero)
- **이유**: 안정성 향상, 다양한 복구 시나리오 대응

**2. 백업 저장소 분리**
- **현재**: 단일 S3 버킷
- **변화**: 
  - EBS 스냅샷 → S3 (인프라 백업)
  - Velero 백업 → S3 (애플리케이션 백업)
- **이유**: 백업 목적별 분리, 관리 용이

**3. 라이프사이클 정책**
- **현재**: 수동으로 오래된 백업 삭제
- **변화**: S3 Lifecycle Policy로 자동 관리
- **이유**: 비용 최적화, 장기 보관

---

## 📊 종합 비교표

### 데이터 관점

| 항목 | 현재 | 변화 후 | 변화 이유 |
|------|------|---------|----------|
| **MongoDB** | StatefulSet | DocumentDB | 자동 백업/패치, 고가용성 |
| **Redis** | Deployment | ElastiCache | 자동 페일오버, 백업 |
| **Elasticsearch** | StatefulSet | OpenSearch | 관리형 서비스, 자동 스케일링 |
| **Kafka** | Strimzi | Airflow | 배치 작업에 최적, 단순화 |

### 보안 관점

| 항목 | 현재 | 변화 후 | 변화 이유 |
|------|------|---------|----------|
| **Secret 관리** | Sealed Secret | Secrets Manager | 자동 로테이션, 감사 로그 |
| **네트워크 보안** | NetworkPolicy | Security Groups + NetworkPolicy | 다층 방어, VPC 통합 |
| **서비스 메시** | Istio | Istio 유지 또는 App Mesh | 기능 vs 통합 |
| **위협 탐지** | 수동 | GuardDuty + Security Hub | 자동 위협 탐지 |

### 스토리지 관점

| 항목 | 현재 | 변화 후 | 변화 이유 |
|------|------|---------|----------|
| **블록 스토리지** | Longhorn | EBS | 완전 관리형, 자동 스냅샷 |
| **StorageClass** | longhorn | ebs-sc | AWS 표준, 호환성 |
| **볼륨 확장** | 제한적 | 온라인 확장 | 유연성 향상 |
| **암호화** | 수동 설정 | 기본 암호화 (KMS) | 보안 강화 |

### 백업 관점

| 항목 | 현재 | 변화 후 | 변화 이유 |
|------|------|---------|----------|
| **K8s 백업** | Velero | Velero + AWS S3 | Kubernetes 리소스 백업 최적 |
| **볼륨 스냅샷** | Longhorn 스냅샷 | EBS 스냅샷 (AWS Backup) | 자동 관리, 라이프사이클 |
| **백업 전략** | 단일 백업 | 하이브리드 백업 | 이중 백업, 안정성 향상 |
| **라이프사이클** | 수동 관리 | S3 Lifecycle Policy | 비용 최적화, 자동화 |

---

## 💰 종합 비용 효과

### 데이터 계층
- MongoDB → DocumentDB: 74% 절감 (하드웨어 교체 시)
- Redis → ElastiCache: 64% 절감
- Elasticsearch → OpenSearch: 운영 효율성 향상
- Kafka → Airflow: 운영 부담 감소

### 보안 계층
- Sealed Secret → Secrets Manager: 71% 절감
- 보안 모니터링 강화: GuardDuty + Security Hub

### 스토리지 계층
- Longhorn → EBS: 비용 유사, 관리 부담 감소

### 백업 계층
- Velero → Velero + AWS S3: 75% 절감
- 하이브리드 백업: 이중 백업으로 안정성 향상

### 총 절감 효과
- **하드웨어 교체 시**: 약 68% 절감 (3년 기준)
- **하드웨어 보유 시**: 약 43% 절감 (월간)

---

## 🎯 핵심 변화 요약

### 데이터 관점
1. **관리형 서비스로 전환**: 운영 부담 감소, 자동화
2. **고가용성 자동 구성**: 다운타임 최소화
3. **자동 백업 및 패치**: 보안 강화, 데이터 보호
4. **아키텍처 단순화**: Kafka → Airflow

### 보안 관점
1. **자동 로테이션**: Secrets Manager로 비밀번호 자동 변경
2. **다층 방어**: Security Groups + NetworkPolicy
3. **자동 위협 탐지**: GuardDuty + Security Hub
4. **감사 로그**: 모든 접근 자동 기록

### 스토리지 관점
1. **완전 관리형**: EBS로 운영 부담 감소
2. **자동 스냅샷**: AWS Backup으로 자동 관리
3. **Multi-AZ 복제**: 고가용성 보장
4. **기본 암호화**: KMS 통합

### 백업 관점
1. **하이브리드 전략**: EBS 스냅샷 + Velero
2. **이중 백업**: 안정성 향상
3. **자동 라이프사이클**: S3 Lifecycle Policy
4. **비용 최적화**: 장기 보관 비용 절감

---

## 📋 마이그레이션 체크리스트

### 데이터
- [ ] MongoDB → DocumentDB 마이그레이션
- [ ] Redis → ElastiCache 마이그레이션
- [ ] Elasticsearch → OpenSearch 마이그레이션
- [ ] Kafka → Airflow 전환

### 보안
- [ ] Sealed Secret → Secrets Manager 전환
- [ ] Security Groups 설정
- [ ] GuardDuty 활성화
- [ ] Security Hub 설정

### 스토리지
- [ ] EBS CSI Driver 설치
- [ ] StorageClass 생성
- [ ] PVC 마이그레이션
- [ ] Longhorn 제거

### 백업
- [ ] Velero AWS S3 연동
- [ ] AWS Backup 설정
- [ ] 하이브리드 백업 전략 수립
- [ ] 라이프사이클 정책 설정

---

**작성일**: 2024년
**버전**: 1.0
**담당**: 데이터 및 SecOps

