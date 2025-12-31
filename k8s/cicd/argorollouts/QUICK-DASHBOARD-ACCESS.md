# Argo Rollouts 대시보드 빠른 접근 가이드

## ✅ 가장 간단한 방법: CLI 직접 실행

### 방법 1: kubectl-argo-rollouts CLI 설치 후 실행

```bash
# 1. CLI 설치 (한 번만)
curl -LO https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64
chmod +x ./kubectl-argo-rollouts-linux-amd64
sudo mv ./kubectl-argo-rollouts-linux-amd64 /usr/local/bin/kubectl-argo-rollouts

# 2. 대시보드 실행
kubectl argo rollouts dashboard

# 브라우저에서 http://localhost:3100 접근
```

---

## 🎯 영상 촬영용 추천 방법

### Step 1: 대시보드 미리 열기 (권장!)

**별도 터미널에서 실행:**

```bash
# CLI 설치 (처음 한 번만)
curl -LO https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64
chmod +x ./kubectl-argo-rollouts-linux-amd64
sudo mv ./kubectl-argo-rollouts-linux-amd64 /usr/local/bin/kubectl-argo-rollouts

# 대시보드 실행
kubectl argo rollouts dashboard
```

**브라우저에서:**
- http://localhost:3100 접근
- 대시보드를 열어두고 준비 완료!

---

### Step 2: 배포 시연 시작

**다른 터미널에서:**

```bash
# 새 버전 배포
kubectl argo rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas \
  -n apc-fe-ns

# 대시보드에서 실시간으로 변화 확인!
```

---

## 📊 대시보드에서 볼 수 있는 것

1. **Rollout 목록**
   - 모든 Rollout 목록
   - 네임스페이스별 필터링

2. **Rollout 상세 정보**
   - 배포 전략 (Blue-Green)
   - 현재 단계
   - Pod 상태
   - 트래픽 분할 상태

3. **배포 제어**
   - Promote 버튼
   - Rollback 버튼
   - Pause/Resume 버튼

---

## 🎬 시연 시나리오

### 화면 구성

**화면 1 (왼쪽 또는 위):** Argo Rollouts 대시보드
- Rollout 상태 실시간 확인

**화면 2 (오른쪽 또는 아래):** 터미널
- CLI 명령어 실행

**화면 3 (선택):** 브라우저
- 실제 웹사이트 확인 (Hello 크리스마스)

---

## 💡 빠른 참조

### 대시보드 실행
```bash
kubectl argo rollouts dashboard
```

### 특정 네임스페이스만 보기
```bash
kubectl argo rollouts dashboard --namespace apc-fe-ns
```

### 다른 포트 사용
```bash
kubectl argo rollouts dashboard --port 8080
# → http://localhost:8080
```

---

## ⚠️ 문제 해결

### CLI가 없는 경우

```bash
# 설치
curl -LO https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64
chmod +x ./kubectl-argo-rollouts-linux-amd64
sudo mv ./kubectl-argo-rollouts-linux-amd64 /usr/local/bin/kubectl-argo-rollouts

# 확인
kubectl argo rollouts version
```

### 포트가 이미 사용 중인 경우

```bash
# 다른 포트 사용
kubectl argo rollouts dashboard --port 8080
```

---

## ✅ 체크리스트

시연 전:
- [ ] kubectl-argo-rollouts CLI 설치
- [ ] 대시보드 실행 (`kubectl argo rollouts dashboard`)
- [ ] 브라우저에서 http://localhost:3100 접근 확인
- [ ] Rollout 목록 확인

시연 중:
- [ ] 대시보드에서 Rollout 상태 확인
- [ ] 새 버전 배포 후 대시보드에서 변화 확인
- [ ] Promote 후 대시보드에서 전환 확인
- [ ] 롤백 후 대시보드에서 복구 확인

