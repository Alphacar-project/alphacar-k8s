# Argo Rollouts 대시보드 접근 가이드

## 🚀 빠른 접근 방법

### 방법 1: Port Forward (가장 간단)

```bash
# 별도 터미널에서 실행 (백그라운드로 실행 가능)
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 3100:3100
```

**브라우저에서 접근:**
- http://localhost:3100

---

### 방법 2: 백그라운드 실행

```bash
# 백그라운드로 실행
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 3100:3100 &

# 프로세스 확인
jobs

# 종료하려면
fg  # 포그라운드로 가져오기
Ctrl+C  # 종료
```

---

### 방법 3: CLI 직접 실행 (로컬에 kubectl-argo-rollouts 설치된 경우)

```bash
# 로컬에서 직접 실행
kubectl argo rollouts dashboard

# 특정 네임스페이스만 보기
kubectl argo rollouts dashboard --namespace apc-fe-ns
```

---

## 📊 대시보드 사용법

### 1. Rollout 목록 보기
- 대시보드에서 모든 Rollout 목록 확인
- 네임스페이스별 필터링 가능

### 2. Rollout 상세 보기
- Rollout 클릭 → 상세 정보 확인
- 배포 전략 (Blue-Green, Canary)
- 현재 단계 및 상태
- Pod 상태

### 3. 배포 제어
- **Promote**: 새 버전으로 전환
- **Rollback**: 이전 버전으로 롤백
- **Pause**: 배포 일시 중지
- **Resume**: 배포 재개

---

## 🎬 영상 촬영 시나리오

### 추천 워크플로우

1. **대시보드 미리 열기** (권장)
   ```bash
   # 별도 터미널에서
   kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 3100:3100
   ```
   - 브라우저에서 http://localhost:3100 접근
   - 대시보드가 열려있는 상태로 준비

2. **배포 시연 시작**
   - 대시보드에서 Rollout 상태 확인
   - 새 버전 배포 명령어 실행
   - 대시보드에서 실시간으로 변화 확인

3. **Promote 시연**
   - 대시보드에서 Promote 버튼 클릭
   - 또는 CLI로 실행 후 대시보드에서 확인

4. **롤백 시연**
   - 대시보드에서 Rollback 버튼 클릭
   - 또는 CLI로 실행 후 대시보드에서 확인

---

## 💡 팁

### 대시보드와 CLI 함께 사용

- **대시보드**: 시각적 확인 및 간단한 제어
- **CLI**: 정확한 명령어 실행 및 자동화

### 여러 터미널 사용

**터미널 1**: Port Forward (대시보드)
```bash
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 3100:3100
```

**터미널 2**: CLI 명령어 실행
```bash
kubectl argo rollouts set image frontend ...
kubectl argo rollouts promote frontend ...
```

**터미널 3**: 상태 확인
```bash
watch kubectl argo rollouts get rollout frontend -n apc-fe-ns
```

---

## 🔧 트러블슈팅

### Port Forward가 안 되는 경우

```bash
# Pod 상태 확인
kubectl get pods -n argo-rollouts -l app=argo-rollouts-ui

# Pod 로그 확인
kubectl logs -n argo-rollouts -l app=argo-rollouts-ui

# 다른 포트 사용
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 8080:3100
# → http://localhost:8080
```

### 대시보드가 안 보이는 경우

```bash
# UI 배포 확인
kubectl get deployment argo-rollouts-ui -n argo-rollouts

# Service 확인
kubectl get svc argo-rollouts-ui -n argo-rollouts

# 재배포
kubectl delete -f argo-rollouts-ui.yaml
kubectl apply -f argo-rollouts-ui.yaml
```

---

## ✅ 체크리스트

대시보드 접근 전:
- [ ] Argo Rollouts 설치 확인
- [ ] UI 배포 확인
- [ ] Port Forward 실행
- [ ] 브라우저에서 접근 테스트

대시보드 사용:
- [ ] Rollout 목록 확인
- [ ] Rollout 상세 정보 확인
- [ ] 배포 제어 기능 확인

