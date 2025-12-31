# AlphaCar 보안 정책 - 동종업계 공격 방어 체계

## 📋 개요

AlphaCar는 **견적 서비스 제공 사이트**로, 경쟁사로부터의 공격(데이터 탈취, 서비스 방해, 불법 접근 등)을 방어하기 위해 다층 보안 체계를 구축했습니다.

---

## 🛡️ 보안 구성 요소

| 구성 요소 | 목적 | 방어 계층 |
|----------|------|----------|
| **Istio AuthorizationPolicy** | 서비스 간 통신 제어 (L7) | 애플리케이션 레벨 |
| **Kubernetes NetworkPolicy** | 네트워크 트래픽 제어 (L3/L4) | 네트워크 레벨 |
| **Kubernetes RBAC** | 클러스터 리소스 접근 제어 | 인증/인가 레벨 |
| **Kyverno** | 리소스 배포 전 자동 검증 및 정책 강제 | 정책 강제 레벨 |
| **Sealed Secret** | 민감 정보 암호화 관리 | 데이터 보호 레벨 |

---

## 1️⃣ Istio AuthorizationPolicy

### 🎯 목적
서비스 간 통신을 애플리케이션 레벨(L7)에서 제어하여, 허가된 서비스만 특정 백엔드 API에 접근할 수 있도록 보장

### 💥 공격 시나리오

**시나리오 1: 경쟁사가 내부 API 직접 호출 시도**
```
공격자: 경쟁사 개발자가 인터넷을 통해 우리 서비스의 내부 API 엔드포인트를 발견
목적: 견적 데이터 수집, API 기능 분석, 서비스 방해
공격 방법: 외부에서 직접 백엔드 서비스 포트로 요청
```

**시나리오 2: 침입한 Pod에서 다른 서비스로의 무단 접근**
```
공격자: 침입 성공한 악성 Pod
목적: 다른 백엔드 서비스로의 무단 접근, 데이터 탈취
공격 방법: 같은 클러스터 내에서 임의의 서비스로 요청
```

### ✅ 방어 방법

**1. 백엔드 서비스별 세분화된 접근 제어**

각 백엔드 서비스에 대해 **특정 네임스페이스와 포트만 허용**:

```yaml
# 예: quote-backend-authz-policy
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: quote-backend-authz-policy
  namespace: apc-be-ns
spec:
  selector:
    matchLabels:
      app: quote-backend
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/istio-system/sa/istio-ingressgateway"]
    - source:
        namespaces: ["apc-fe-ns"]
    - source:
        namespaces: ["apc-be-ns"]
    to:
    - operation:
        ports: ["3003"]
```

**방어 효과:**
- ✅ Istio Gateway, 프론트엔드, 백엔드 네임스페이스만 접근 허용
- ✅ 외부에서 직접 백엔드 서비스로 접근 차단
- ✅ 각 서비스별 포트 제한 (3003, 3005, 3007, 3008, 4000)

**2. 백엔드 서비스의 아웃바운드 트래픽 제어**

백엔드 서비스가 **허가된 리소스에만 접근** 가능:

```yaml
# backend-egress-authz-policy
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: backend-egress-authz-policy
  namespace: apc-be-ns
spec:
  selector:
    matchLabels:
      component: backend
  action: ALLOW
  rules:
  - to:
    - operation:
        hosts: ["*.apc-db-ns.svc.cluster.local"]
        ports: ["27017", "3306", "6379"]  # MongoDB, MySQL, Redis
  - to:
    - operation:
        hosts: ["*.apc-obsv-ns.svc.cluster.local"]
        ports: ["4317", "4318"]  # OpenTelemetry
```

**방어 효과:**
- ✅ 데이터베이스와 관찰성 서비스만 접근 가능
- ✅ 외부 API 호출 차단 (예: 경쟁사 서버로 데이터 전송)
- ✅ 의도치 않은 데이터 유출 방지

**3. 데이터베이스 접근 제어**

```yaml
# database-authz-policy
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: database-authz-policy
  namespace: apc-db-ns
spec:
  selector:
    matchLabels:
      component: database
  action: ALLOW
  rules:
  - from:
    - source:
        namespaces: ["apc-be-ns", "apc-db-ns", "apc-ek-ns", "apc-striming-ns"]
    to:
    - operation:
        ports: ["27017", "3306", "6379"]
```

**방어 효과:**
- ✅ 허가된 네임스페이스에서만 데이터베이스 접근
- ✅ 침입한 Pod에서 데이터베이스 직접 접근 차단

### 📊 현재 구성 (7개 정책)

| 네임스페이스 | 정책 수 | 주요 정책 |
|------------|--------|----------|
| apc-be-ns | 6개 | 백엔드 서비스별 접근 제어 (quote, search, community, news, aichat, egress) |
| apc-db-ns | 1개 | 데이터베이스 접근 제어 |

---

## 2️⃣ Kubernetes NetworkPolicy

### 🎯 목적
네트워크 레벨(L3/L4)에서 Pod 간 통신을 제어하여, 허가된 네임스페이스와 포트만 통신할 수 있도록 보장

### 💥 공격 시나리오

**시나리오 1: 침입한 Pod에서 데이터베이스 직접 접근**
```
공격자: 침입 성공한 악성 Pod (어떤 네임스페이스에든 존재 가능)
목적: 데이터베이스 직접 접근, 데이터 탈취
공격 방법: 네트워크 레벨에서 데이터베이스 포트로 직접 연결 시도
```

**시나리오 2: 외부 네트워크에서 데이터베이스 노출 공격**
```
공격자: 외부 공격자
목적: 데이터베이스 직접 공격
공격 방법: NodePort나 LoadBalancer를 통해 데이터베이스 접근 시도
```

### ✅ 방어 방법

**데이터베이스 네트워크 격리 정책**

```yaml
# database-strict-policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-strict-policy
  namespace: apc-db-ns
spec:
  podSelector:
    matchLabels:
      component: database
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: apc-be-ns
    ports:
    - protocol: TCP
      port: 27017  # MongoDB
    - protocol: TCP
      port: 6379   # Redis
  - from:
    - namespaceSelector:
        matchLabels:
          name: apc-ek-ns  # Monstache
    ports:
    - protocol: TCP
      port: 27017
  - from:
    - namespaceSelector:
        matchLabels:
          name: apc-striming-ns  # Kafka
    ports:
    - protocol: TCP
      port: 27017
  egress:
  - to:
    - namespaceSelector: {}  # DNS 허용
    ports:
    - protocol: UDP
      port: 53
  - to:
    - namespaceSelector:
        matchLabels:
          name: apc-db-ns  # MongoDB Replica Set 통신
    ports:
    - protocol: TCP
      port: 27017
```

**방어 효과:**
- ✅ 특정 네임스페이스에서만 데이터베이스 접근 허용
- ✅ 외부 네트워크에서 데이터베이스 접근 차단
- ✅ 침입한 Pod에서 데이터베이스 직접 접근 차단
- ✅ Egress 제한으로 데이터 유출 방지

### 📊 현재 구성 (2개 정책)

| 네임스페이스 | 정책 | 목적 |
|------------|------|------|
| apc-db-ns | database-strict-policy | 데이터베이스 네트워크 격리 |
| apc-striming-ns | kafka-cluster-network-policy-kafka | Kafka 클러스터 네트워크 격리 |

---

## 3️⃣ Kubernetes RBAC (Role-Based Access Control)

### 🎯 목적
클러스터 내 리소스 접근을 제어하여, 각 서비스가 필요한 최소한의 권한만 가지도록 보장

### 💥 공격 시나리오

**시나리오 1: 침입한 Pod에서 Kubernetes API 직접 호출**
```
공격자: 침입 성공한 악성 Pod (ServiceAccount 탈취)
목적: 다른 Pod 삭제, Secret 탈취, 리소스 조작
공격 방법: Kubernetes API Server에 직접 요청하여 클러스터 리소스 조작
```

**시나리오 2: 과도한 권한을 가진 ServiceAccount 악용**
```
공격자: 과도한 권한을 가진 ServiceAccount를 사용하는 악성 애플리케이션
목적: 모든 네임스페이스의 Secret 읽기, Pod 삭제 등
공격 방법: cluster-admin 권한 등 과도한 권한 활용
```

### ✅ 방어 방법

**1. 최소 권한 원칙 (Principle of Least Privilege)**

각 서비스에 **필요한 최소한의 권한만 부여**:

```yaml
# 예: 백엔드 서비스용 Secret 읽기 권한
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend-sa
  namespace: apc-be-ns
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: backend-secret-reader
  namespace: apc-be-ns
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]
  resourceNames: ["mongodb-secret", "redis-secret", "jwt-secret"]  # 특정 Secret만
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: backend-secret-reader-binding
  namespace: apc-be-ns
subjects:
- kind: ServiceAccount
  name: backend-sa
  namespace: apc-be-ns
roleRef:
  kind: Role
  name: backend-secret-reader
  apiGroup: rbac.authorization.k8s.io
```

**방어 효과:**
- ✅ 특정 Secret만 읽기 가능 (모든 Secret 읽기 불가)
- ✅ Secret 수정/삭제 불가 (읽기만 가능)
- ✅ 다른 네임스페이스 접근 불가 (네임스페이스별 Role)

**2. 네임스페이스별 권한 분리**

```yaml
# 프론트엔드용 ConfigMap 읽기 권한 (백엔드와 분리)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: frontend-configmap-reader
  namespace: apc-fe-ns
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
  resourceNames: ["frontend-config"]
```

**3. 모니터링 서비스용 제한된 권한**

```yaml
# 모니터링 분석 서비스는 Pod 로그만 읽기 가능
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-analysis-role
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list"]
# Secret, ConfigMap, Deployment 등은 접근 불가
```

**방어 효과:**
- ✅ 모니터링 서비스는 로그 읽기만 가능
- ✅ Secret, ConfigMap 등 민감 정보 접근 불가
- ✅ Pod 삭제, 수정 등 조작 불가

### 📊 현재 구성

| 네임스페이스 | Role | 목적 |
|------------|------|------|
| apc-be-ns | backend-secret-reader | 백엔드 Secret 읽기 |
| apc-be-ns | backend-configmap-reader | 백엔드 ConfigMap 읽기 |
| apc-fe-ns | frontend-configmap-reader | 프론트엔드 ConfigMap 읽기 |
| apc-fe-ns | frontend-secret-reader | 프론트엔드 Secret 읽기 |
| apc-obsv-ns | monitoring-analysis-role (ClusterRole) | Pod 로그 읽기 (모니터링) |

---

## 4️⃣ Sealed Secret

### 🎯 목적
민감 정보(Secret)를 Git 저장소에 안전하게 저장하기 위해 암호화하여, 평문 Secret을 Git에 커밋해도 안전하도록 보장

### 💥 공격 시나리오

**시나리오 1: Git 저장소 유출 시 평문 Secret 노출**
```
공격자: Git 저장소 접근 권한 탈취 또는 저장소 유출
목적: 데이터베이스 비밀번호, JWT Secret, AWS 키 등 민감 정보 탈취
공격 방법: Git 저장소에서 평문으로 저장된 Secret 파일 확인
결과: 모든 민감 정보 노출 → 데이터베이스 접근, 서비스 위조 등
```

**시나리오 2: 개발자 PC 유출 시 평문 Secret 노출**
```
공격자: 개발자 PC/노트북 유출
목적: 로컬에 저장된 Secret 파일에서 민감 정보 탈취
공격 방법: PC/노트북 물리적 접근 또는 원격 침입
결과: Secret 파일 복사 → 프로덕션 환경 접근
```

### ✅ 방어 방법

**Sealed Secret 사용**

Sealed Secret은 **공개 키 암호화 방식**을 사용하여 Secret을 암호화합니다:

```yaml
# 평문 Secret (Git에 저장하면 안됨 ❌)
apiVersion: v1
kind: Secret
metadata:
  name: mongodb-secret
  namespace: apc-be-ns
type: Opaque
stringData:
  username: "triple_user"
  password: "triple_password"  # 평문으로 저장됨
```

```yaml
# Sealed Secret (Git에 안전하게 저장 가능 ✅)
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: mongodb-secret
  namespace: apc-be-ns
spec:
  encryptedData:
    username: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEQAx...  # 암호화됨
    password: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEQAx...  # 암호화됨
```

**작동 방식:**

1. **Sealed Secret Controller**가 클러스터에 설치됨 (공개 키 보유)
2. 개발자가 `kubeseal` 도구로 평문 Secret을 암호화
3. 암호화된 Sealed Secret을 Git에 커밋 (안전)
4. 클러스터에서 Sealed Secret Controller가 자동으로 복호화하여 일반 Secret 생성

**방어 효과:**
- ✅ Git 저장소 유출 시에도 암호화된 정보만 노출
- ✅ 개발자 PC 유출 시에도 평문 Secret 없음
- ✅ 버전 관리 시스템(Git)에 안전하게 저장 가능
- ✅ 클러스터별로 다른 암호화 키 사용 가능

### 📊 현재 구성

**사용 대상:**
- 데이터베이스 비밀번호 (MongoDB, MySQL, Redis)
- JWT Secret
- AWS Bedrock API 키
- Harbor Registry 인증 정보
- 기타 민감 정보

**장점:**
- GitOps 워크플로우와 완벽 호환
- 버전 관리 가능 (Secret 변경 이력 추적)
- 클러스터별 독립적인 암호화 키

---

## 🔒 다층 방어 체계

### 공격 시나리오별 방어 매트릭스

| 공격 시나리오 | Istio AuthzPolicy | NetworkPolicy | RBAC | Kyverno | Sealed Secret |
|-------------|------------------|---------------|------|---------|---------------|
| **외부에서 내부 API 직접 호출** | ✅ 차단 | - | - | - | - |
| **침입한 Pod에서 데이터베이스 접근** | ✅ 차단 | ✅ 차단 | - | - | - |
| **Kubernetes API 악용** | - | - | ✅ 차단 | - | - |
| **보안 취약점이 있는 Pod 배포** | - | - | - | ✅ 감지/경고 | - |
| **리소스 고갈 공격** | - | - | - | ✅ 감지/경고 | - |
| **평문 Secret 배포** | - | - | - | ✅ 감지/경고 | - |
| **Git 저장소 유출** | - | - | - | - | ✅ 방어 |
| **과도한 권한 악용** | - | - | ✅ 차단 | - | - |

### 방어 계층 구조

```
┌─────────────────────────────────────────┐
│  1. Istio AuthorizationPolicy (L7)      │  ← 애플리케이션 레벨 제어
│     - 서비스 간 통신 제어                │
│     - 허가된 네임스페이스/포트만 허용    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  2. Kubernetes NetworkPolicy (L3/L4)    │  ← 네트워크 레벨 제어
│     - Pod 간 네트워크 트래픽 제어        │
│     - 허가된 네임스페이스만 통신 허용    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  3. Kubernetes RBAC                     │  ← 인증/인가 레벨 제어
│     - 클러스터 리소스 접근 제어          │
│     - 최소 권한 원칙 적용                │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  4. Kyverno (Policy Engine)             │  ← 정책 강제 레벨
│     - 리소스 배포 전 자동 검증           │
│     - 보안 정책 자동 강제                │
│     - 지속적인 모니터링                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  5. Sealed Secret                       │  ← 데이터 보호 레벨
│     - 민감 정보 암호화 저장              │
│     - Git 저장소 안전 저장               │
└─────────────────────────────────────────┘
```

---

## 📈 보안 효과

### 정량적 효과

1. **접근 제어 정책 수**
   - AuthorizationPolicy: 7개
   - NetworkPolicy: 2개
   - RBAC Role/RoleBinding: 10개 이상
   - Kyverno ClusterPolicy: 9개

2. **차단되는 공격 시나리오**
   - 외부 직접 API 접근: ✅ 차단
   - 데이터베이스 무단 접근: ✅ 차단
   - Kubernetes API 악용: ✅ 차단
   - Git 저장소 유출: ✅ 방어

3. **권한 분리**
   - 네임스페이스별 권한 분리
   - 서비스별 최소 권한 적용
   - 읽기 전용 권한 분리

### 정성적 효과

- ✅ **방어 심화**: 다층 방어 체계로 단일 지점 실패 방지
- ✅ **최소 권한**: 각 서비스가 필요한 최소한의 권한만 보유
- ✅ **가시성**: 정책이 명시적으로 정의되어 감사 및 추적 가능
- ✅ **자동화**: GitOps 워크플로우와 통합하여 안전한 배포

---

## 🎯 결론

AlphaCar는 **견적 서비스 제공 사이트**로서 동종업계로부터의 공격을 방어하기 위해:

1. ✅ **Istio AuthorizationPolicy**: 서비스 간 통신을 애플리케이션 레벨에서 제어
2. ✅ **Kubernetes NetworkPolicy**: 네트워크 레벨에서 Pod 간 통신 제어
3. ✅ **Kubernetes RBAC**: 클러스터 리소스 접근을 최소 권한 원칙으로 제어
4. ✅ **Kyverno**: 리소스 배포 전 자동 검증 및 보안 정책 강제
5. ✅ **Sealed Secret**: 민감 정보를 암호화하여 Git 저장소에 안전하게 저장

이러한 **다층 방어 체계**를 통해 외부 공격, 내부 침입, 권한 악용, 보안 취약점 배포, 데이터 유출 등 다양한 공격 시나리오로부터 서비스를 보호합니다.

