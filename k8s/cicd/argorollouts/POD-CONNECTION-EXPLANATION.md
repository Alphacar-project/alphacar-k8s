# Pod 연결 관계 설명

## ❌ 핵심 답변

**rollouts-demo는 우리 Pod와 전혀 연결되어 있지 않습니다!**

---

## 📊 실제 구조

### 1. 우리 frontend (실제 서비스)

**Namespace**: `apc-fe-ns`

**Pod**:
- `frontend-xxxxx` (우리 실제 Pod)
- 우리 서비스의 실제 인스턴스

**Rollout**:
- `frontend` (우리 Rollout)
- 우리 서비스를 관리

**Service**:
- `frontend-stable` (Blue 버전)
- `frontend-preview` (Green 버전)
- `frontend` (기본 서비스)

**접속**:
- https://alphacar.cloud (실제 우리 서비스)

---

### 2. Rollouts-demo (시연용 앱)

**Namespace**: `rollouts-demo`

**Pod**:
- `rollouts-demo-xxxxx` (시연용 Pod)
- 우리 Pod와 **완전히 별개**

**Rollout**:
- `rollouts-demo` (시연용 Rollout)
- 우리 Rollout과 **완전히 별개**

**Service**:
- `rollouts-demo-active` (Blue 버전)
- `rollouts-demo-preview` (Green 버전)

**접속**:
- http://localhost:9001, 9002 (시연용 앱)

---

## 🔍 확인 방법

### 우리 Pod 확인
```bash
kubectl get pods -n apc-fe-ns -l app=frontend
```

결과:
- `frontend-xxxxx` (우리 실제 Pod)

### Rollouts-demo Pod 확인
```bash
kubectl get pods -n rollouts-demo -l app=rollouts-demo
```

결과:
- `rollouts-demo-xxxxx` (시연용 Pod, 우리 Pod와 무관)

---

## 📋 비교표

| 항목 | 우리 frontend | Rollouts-demo |
|------|--------------|---------------|
| **Namespace** | `apc-fe-ns` | `rollouts-demo` |
| **Pod 이름** | `frontend-xxxxx` | `rollouts-demo-xxxxx` |
| **Rollout** | `frontend` | `rollouts-demo` |
| **연결 관계** | 우리 실제 서비스 | 우리와 **완전히 별개** |
| **용도** | 실제 서비스 | 시연용 |

---

## ✅ 정리

### rollouts-demo는:
- ❌ 우리 Pod와 연결되지 않음
- ❌ 우리 서비스와 연결되지 않음
- ✅ **완전히 별개의 앱**
- ✅ **시연용으로만 사용**
- ✅ **Blue-Green 배포 개념 설명용**

### 우리 frontend는:
- ✅ 우리 실제 Pod 사용
- ✅ 우리 실제 서비스
- ✅ https://alphacar.cloud 접속
- ✅ Dashboard에서 관리

---

## 🎯 핵심 포인트

1. **rollouts-demo = 별도의 앱**
   - 우리 Pod와 전혀 연결 안 됨
   - 시연용으로만 존재

2. **우리 frontend = 실제 서비스**
   - 우리 실제 Pod 사용
   - 실제 우리 서비스

3. **둘 다 Dashboard에서 보임**
   - 같은 Dashboard에서 두 Rollout 모두 관리 가능
   - 하지만 완전히 별개의 앱

---

## 💡 비유

- **우리 frontend**: 실제 우리 집 (실제 서비스)
- **Rollouts-demo**: 전시용 모형 집 (시연용)
- 둘 다 같은 건물(Dashboard)에서 볼 수 있지만, 완전히 별개!

