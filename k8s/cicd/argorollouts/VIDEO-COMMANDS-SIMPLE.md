# 🎬 영상 촬영 명령어 (복사-붙여넣기용)

## 📋 Step 1: 대시보드 접속
브라우저: `http://localhost:9003/rollouts/`

---

## 📋 Step 2: 크리스마스 버전 배포
```bash
kubectl-argo-rollouts set image frontend frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas -n apc-fe-ns
```

---

## 📋 Step 3: Preview 확인
대시보드에서 Preview 버전 확인
브라우저: https://alphacar.cloud (아직 크리스마스 없음)

---

## 📋 Step 4: Promote (크리스마스 버전으로 전환)
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

브라우저: https://alphacar.cloud 새로고침 (크리스마스 나타남)

---

## 📋 Step 5: 롤백 배포
```bash
kubectl-argo-rollouts set image frontend frontend=192.168.0.170:30000/alphacar/frontend:1.0.053-d53fade -n apc-fe-ns
```

---

## 📋 Step 6: Preview 확인
대시보드에서 Preview 버전 확인
브라우저: https://alphacar.cloud (아직 크리스마스 있음)

---

## 📋 Step 7: Promote (롤백 완료)
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

브라우저: https://alphacar.cloud 새로고침 (크리스마스 사라짐)

---

## 📋 전체 명령어 (한 번에 복사)

```bash
# Step 2: 크리스마스 버전 배포
kubectl-argo-rollouts set image frontend frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas -n apc-fe-ns

# Step 4: Promote
kubectl-argo-rollouts promote frontend -n apc-fe-ns

# Step 5: 롤백 배포
kubectl-argo-rollouts set image frontend frontend=192.168.0.170:30000/alphacar/frontend:1.0.053-d53fade -n apc-fe-ns

# Step 7: Promote
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

