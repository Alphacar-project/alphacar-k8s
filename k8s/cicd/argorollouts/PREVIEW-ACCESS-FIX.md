# Preview 접근 문제 해결

## 🔍 문제: `192.168.0.170:8082` 접근 불가

**원인:** Port Forward가 실행되지 않았거나 종료됨

---

## ✅ 해결 방법

### 방법 1: Port Forward 다시 실행

**터미널에서:**
```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000
```

**이 터미널은 그대로 두세요!** (종료하지 마세요)

**브라우저에서:**
- http://localhost:8082 접근
- 또는 http://192.168.0.170:8082 접근 (같은 서버인 경우)

---

### 방법 2: 다른 포트 사용

**이미 8082가 사용 중인 경우:**
```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8083:8000
```

**브라우저에서:**
- http://localhost:8083 접근

---

## 🎯 현재 상태 확인

### Promote 후 상태

**Promote가 완료되면:**
- Preview 서비스는 스케일 다운됨
- Preview Pod가 없을 수 있음
- **이 경우 Preview 접근 불가 (정상)**

**현재 프로덕션 확인:**
- https://alphacar.cloud 접근
- "Hello 크리스마스 🎄" 확인

---

## 📊 Preview vs Stable 접근

### Preview 접근 (Promote 전에만 가능)

**Promote 전:**
```bash
# Preview Pod가 실행 중일 때만 가능
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000
```

**브라우저:**
- http://localhost:8082
- "Hello 크리스마스 🎄" 확인

### Stable 접근 (프로덕션)

**항상 가능:**
- https://alphacar.cloud
- VirtualService를 통해 자동 라우팅

---

## 🔍 문제 진단

### 1. Preview Pod 확인

```bash
kubectl get pods -n apc-fe-ns -l app=frontend
```

**Preview Pod가 없으면:**
- Promote가 완료되어 스케일 다운됨
- Preview 접근 불가 (정상)

### 2. Port Forward 확인

```bash
ps aux | grep "port-forward.*frontend-preview"
```

**실행 중이 아니면:**
- Port Forward 다시 실행 필요

### 3. Service 확인

```bash
kubectl get svc frontend-preview -n apc-fe-ns
```

**Service가 없으면:**
- Rollout이 제대로 배포되지 않음

---

## 💡 추천 방법

### Promote 후에는 프로덕션 확인

**Promote가 완료되었으면:**
- Preview는 더 이상 필요 없음
- **프로덕션에서 확인:**
  - https://alphacar.cloud
  - "Hello 크리스마스 🎄" 확인

### Preview는 Promote 전에만 확인

**Promote 전:**
1. 새 버전 배포
2. Preview Pod 생성 확인
3. Port Forward 실행
4. Preview 확인
5. Promote 실행

---

## ✅ 빠른 해결

**지금 바로 실행:**

```bash
# Port Forward 실행
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8082:8000
```

**브라우저에서:**
- http://localhost:8082 접근

**또는 Promote가 완료되었다면:**
- https://alphacar.cloud 접근
- 프로덕션에서 "Hello 크리스마스 🎄" 확인

