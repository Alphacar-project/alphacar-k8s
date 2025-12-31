# 8082 포트 접근 문제 빠른 해결

## 🔍 문제

**`192.168.0.170:8082` 접근 불가**

---

## ✅ 해결 방법

### 방법 1: localhost로 접근 (가장 간단)

**브라우저에서:**
- http://localhost:8082 접근
- Port-forward는 localhost로만 바인딩됨

---

### 방법 2: 모든 인터페이스에서 접근 가능하도록 설정

**터미널에서:**
```bash
# 기존 port-forward 종료
pkill -f "port-forward.*8082"

# 모든 인터페이스에서 접근 가능하도록 실행
kubectl port-forward -n apc-fe-ns svc/frontend-preview --address=0.0.0.0 8082:8000
```

**브라우저에서:**
- http://192.168.0.170:8082 접근 가능

---

### 방법 3: 스크립트 사용

**터미널에서:**
```bash
/home/alphacar/alphacar-final/k8s/cicd/argorollouts/port-forward-preview.sh
```

---

## 🎯 현재 상태

**Promote가 완료되었으므로:**

### 프로덕션 확인 (권장)

**브라우저:**
- **https://alphacar.cloud** 접근
- "고객님, 어떤 차를 찾으시나요? **Hello 크리스마스 🎄**" 확인!

**→ 이게 가장 정확합니다!** 프로덕션에서 확인하세요.

---

## 💡 참고

### Preview vs 프로덕션

**Preview (8082):**
- Promote 전에만 필요
- 새 버전 테스트용
- Promote 후에는 스케일 다운됨

**프로덕션 (alphacar.cloud):**
- 항상 접근 가능
- 실제 사용자가 보는 버전
- Promote 후 새 버전 확인 가능

---

## ✅ 추천

**Promote가 완료되었으므로:**
- ✅ **프로덕션 확인**: https://alphacar.cloud
- ✅ "Hello 크리스마스 🎄" 확인
- ❌ Preview 접근 불필요 (Promote 완료됨)

**→ 프로덕션에서 확인하세요!**

