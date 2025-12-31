# Preview 접속 최종 해결책

## ❌ Port Forward 문제

Service를 통한 Port Forward가 Istio sidecar 때문에 실패합니다.

---

## ✅ 해결 방법: Dashboard에서 바로 Promote

Port Forward가 어렵다면, **Dashboard에서 Preview 상태를 확인하고 바로 Promote**하는 것이 가장 실용적입니다.

---

## 🎬 영상 촬영 시나리오 (수정)

### Step 1: Dashboard에서 Preview 상태 확인

**대시보드**: http://localhost:9003/rollouts/
- `frontend` Rollout 선택
- Preview 버전 확인:
  - `1.0.053-d53fade` (preview)
  - `1.0.054-christmas` (stable, active)
- Preview Pod 상태 확인 (Running)

**설명**: "Preview 버전이 생성되었고 정상적으로 실행 중입니다"

---

### Step 2: Promote 실행

**대시보드**: "Promote" 버튼 클릭

**또는 터미널**:
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

**설명**: "Preview 확인 후 프로덕션으로 전환합니다"

---

### Step 3: 프로덕션 확인

**브라우저**: https://alphacar.cloud 새로고침

**확인 사항**:
- "Hello 크리스마스 🎄" **사라짐** 확인!
- 이전 버전으로 롤백 완료

---

## 📋 전체 명령어 (간단 버전)

```bash
# 1. Preview 상태 확인
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns

# 2. Promote
kubectl-argo-rollouts promote frontend -n apc-fe-ns

# 3. 프로덕션 확인
# 브라우저: https://alphacar.cloud
```

---

## 💡 핵심 포인트

1. **Port Forward는 선택사항**
   - Preview 접속이 어려워도 Dashboard에서 상태 확인 가능
   - 바로 Promote 실행 가능

2. **Dashboard가 핵심**
   - Preview 상태 확인
   - Promote 버튼으로 전환
   - 모든 과정을 시각적으로 확인

3. **프로덕션에서 최종 확인**
   - https://alphacar.cloud에서 실제 변경 확인
   - 이것이 가장 중요한 확인 단계

---

## 🎯 권장 시나리오

### 영상 촬영 시:

1. **Dashboard 화면** (10초)
   - Preview 버전 표시
   - "Preview가 생성되었습니다" 설명

2. **Promote 버튼 클릭** (5초)
   - "Promote를 실행합니다" 설명

3. **프로덕션 브라우저** (10초)
   - https://alphacar.cloud 새로고침
   - "Hello 크리스마스가 사라졌습니다" 확인

---

## ✅ 정리

- **Port Forward 실패해도 문제없음**
- **Dashboard에서 Preview 상태 확인 가능**
- **Promote로 바로 전환 가능**
- **프로덕션에서 최종 확인**

이렇게 하면 Blue-Green 배포의 핵심 과정을 완벽하게 시연할 수 있습니다!

