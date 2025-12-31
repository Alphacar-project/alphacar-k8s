# Promote 버튼 설명

## 🎯 Promote란?

**Promote = 프로덕션 전환**

Blue-Green 배포에서 Preview 버전(새 버전)을 Stable 버전(프로덕션)으로 전환하는 작업입니다.

---

## 📊 Promote 전후 비교

### Promote 전

**Stable (프로덕션):**
- 이미지: `1.0.053-d53fade`
- 상태: Active (실제 트래픽이 여기로 감)
- 브라우저: https://alphacar.cloud → "Hello 크리스마스" 없음

**Preview (새 버전):**
- 이미지: `1.0.054-christmas`
- 상태: Preview (테스트 중)
- 브라우저: http://localhost:8082 → "Hello 크리스마스 🎄" 있음

---

### Promote 후

**Stable (프로덕션):**
- 이미지: `1.0.054-christmas` ← 변경됨!
- 상태: Active (실제 트래픽이 여기로 감)
- 브라우저: https://alphacar.cloud → "Hello 크리스마스 🎄" 있음!

**Preview:**
- 없음 (스케일 다운됨)

---

## 🚀 Promote 작동 방식

### 1. 대시보드에서 Promote 클릭

**또는 터미널에서:**
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

### 2. 자동으로 일어나는 일

1. **Service Selector 변경**
   - `frontend-stable` Service가 Preview Pod를 가리키도록 변경
   - 트래픽이 Preview 버전으로 전환

2. **Stable Pod 스케일 다운**
   - 기존 Stable Pod가 스케일 다운 (30초 후)
   - 리소스 절약

3. **Preview → Stable 전환**
   - Preview 버전이 Stable 버전이 됨
   - 새 버전이 프로덕션으로 전환

---

## 📊 대시보드에서 확인

### Promote 전
- **Stable**: `1.0.053-d53fade` (Active)
- **Preview**: `1.0.054-christmas` (Preview)
- **Status**: Paused

### Promote 후
- **Stable**: `1.0.054-christmas` (Active) ← 변경됨!
- **Preview**: 없음
- **Status**: Healthy

---

## 🌐 브라우저에서 확인

### Promote 전
- https://alphacar.cloud → "Hello 크리스마스" 없음
- http://localhost:8082 (Preview) → "Hello 크리스마스 🎄" 있음

### Promote 후
- https://alphacar.cloud → "Hello 크리스마스 🎄" 있음! ← 변경됨!

---

## ✅ 결론

**네, Promote를 누르면 배포가 완료됩니다!**

1. ✅ Preview 버전이 프로덕션으로 전환
2. ✅ 트래픽이 새 버전으로 라우팅
3. ✅ 브라우저에서 "Hello 크리스마스 🎄" 확인 가능
4. ✅ 기존 버전은 자동으로 스케일 다운

**→ 완벽한 Blue-Green 배포 완료!**

