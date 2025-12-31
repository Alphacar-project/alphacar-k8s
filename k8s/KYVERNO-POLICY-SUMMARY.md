# Kyverno 정책 요약 (PPT용)

## 📋 현재 적용된 Kyverno ClusterPolicy (9개)

### 1. Pod 보안 기준 (pod-security-baseline)
- **목적**: privileged 컨테이너, hostNetwork 사용 감지
- **효과**: 보안 취약점이 있는 Pod 배포 시 경고
- **모드**: Audit (경고만)

### 2. 리소스 제한 요구 (require-resource-limits)
- **목적**: Deployment/StatefulSet에 CPU/메모리 제한 필수
- **효과**: 리소스 고갈 공격 방지, 클러스터 안정성 보장
- **모드**: Audit (경고만)

### 3. Secret 검증 (validate-secrets)
- **목적**: 평문 Secret 사용 감지, Sealed Secret 권장
- **효과**: 민감 정보 노출 위험 감소
- **모드**: Audit (경고만)
- **대상**: apc-be-ns, apc-fe-ns, apc-db-ns

### 4. 이미지 태그 검증 (validate-image-tags)
- **목적**: `latest` 태그 사용 감지
- **효과**: 버전 관리 가능, 롤백 용이성 확보
- **모드**: Audit (경고만)

### 5. 라벨 요구 (require-labels)
- **목적**: Deployment/Service/Pod에 필수 라벨(`app`) 요구
- **효과**: 리소스 관리 및 정책 적용 용이
- **모드**: Audit (경고만)

### 6. ConfigMap/Secret 참조 검증 (validate-configmap-secret-refs)
- **목적**: 존재하지 않는 ConfigMap/Secret 참조 감지
- **효과**: 배포 실패 사전 방지, 설정 오류 조기 발견
- **모드**: Audit (경고만)

### 7. 네임스페이스 라벨 검증 (validate-namespace-labels)
- **목적**: 네임스페이스에 필수 라벨(`name`) 요구
- **효과**: NetworkPolicy 적용 가능성 보장
- **모드**: Audit (경고만)

### 8. NetworkPolicy 권장 (recommend-network-policy)
- **목적**: NetworkPolicy 없는 네임스페이스 감지
- **효과**: 네트워크 격리 권장, 보안 강화
- **모드**: Generate (자동 생성 권장)

### 9. ServiceAccount 권장 (recommend-service-account)
- **목적**: ServiceAccount 없이 실행되는 Pod 감지
- **효과**: RBAC 정책 적용 가능성 보장, 최소 권한 원칙 준수
- **모드**: Audit (경고만)

---

## 🎯 핵심 요약

- **총 9개 정책** 적용 중
- **대부분 Audit 모드** (경고만, 차단하지 않음)
- **3가지 주요 방어 영역**:
  1. 보안 취약점 방지 (Pod 보안, Secret 검증)
  2. 리소스 관리 (리소스 제한, 라벨 요구)
  3. 네트워크/권한 강화 (NetworkPolicy, ServiceAccount 권장)

---

## 💡 PPT 슬라이드 구성 제안

### 슬라이드 1: Kyverno 정책 개요
- **총 9개 ClusterPolicy 적용**
- **주요 기능**: 리소스 배포 전 자동 검증 및 보안 정책 강제
- **현재 모드**: Audit (경고) → 향후 Enforce (차단)로 전환 가능

### 슬라이드 2: 정책 카테고리별 분류
- **보안 정책** (3개): Pod 보안, Secret 검증, 이미지 태그
- **리소스 관리** (3개): 리소스 제한, 라벨 요구, 참조 검증
- **네트워크/권한** (3개): NetworkPolicy, ServiceAccount, 네임스페이스 라벨

### 슬라이드 3: 주요 정책 상세
- **Pod 보안 기준**: privileged 컨테이너, hostNetwork 사용 감지
- **리소스 제한**: CPU/메모리 제한 필수 → 리소스 고갈 공격 방지
- **Secret 검증**: Sealed Secret 사용 권장 → 민감 정보 노출 방지

---

## 📊 간략 버전 (한 슬라이드용)

| 정책 | 목적 | 효과 |
|------|------|------|
| **pod-security-baseline** | Pod 보안 기준 검증 | privileged 컨테이너 사용 감지 |
| **require-resource-limits** | 리소스 제한 요구 | 리소스 고갈 공격 방지 |
| **validate-secrets** | Secret 검증 | Sealed Secret 사용 권장 |
| **validate-image-tags** | 이미지 태그 검증 | latest 태그 사용 감지 |
| **require-labels** | 필수 라벨 요구 | 리소스 관리 용이 |
| **validate-configmap-secret-refs** | 참조 검증 | 배포 실패 사전 방지 |
| **validate-namespace-labels** | 네임스페이스 라벨 검증 | NetworkPolicy 적용 보장 |
| **recommend-network-policy** | NetworkPolicy 권장 | 네트워크 격리 권장 |
| **recommend-service-account** | ServiceAccount 권장 | RBAC 정책 적용 보장 |

**총 9개 정책 | Audit 모드 (경고) | 점진적 Enforce 전환 예정**




