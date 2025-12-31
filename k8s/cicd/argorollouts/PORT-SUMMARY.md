# 포트 포워딩 요약

## 📋 현재 포트 설정

| 포트 | 서비스 | 설명 | URL |
|------|--------|------|-----|
| **9003** | Argo Rollouts Dashboard | 대시보드 | http://localhost:9003 |
| **9001** | rollouts-demo-active | Blue (Active) | http://localhost:9001 |
| **9002** | rollouts-demo-preview | Green (Preview) | http://localhost:9002 |

---

## 🚀 빠른 시작

### 모든 포트 시작
```bash
cd /home/alphacar/alphacar-final/k8s/cicd/argorollouts
./start-ports.sh
```

### 모든 포트 중지
```bash
./stop-ports.sh
```

---

## 🔧 개별 포트 포워딩

### Dashboard (9003)
```bash
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 9003:3100 --address=0.0.0.0 &
```

### Blue (9001)
```bash
kubectl port-forward -n rollouts-demo svc/rollouts-demo-active 9001:80 --address=0.0.0.0 &
```

### Green (9002)
```bash
kubectl port-forward -n rollouts-demo svc/rollouts-demo-preview 9002:80 --address=0.0.0.0 &
```

---

## ✅ 상태 확인

```bash
ps aux | grep "port-forward.*900" | grep -v grep
```

예상 결과:
- 9003: Dashboard
- 9001: Blue
- 9002: Green

---

## 💡 참고

- `--address=0.0.0.0`: 다른 머신에서도 접근 가능하도록 설정
- 포트 충돌 시: `pkill -f "port-forward.*9003"`로 기존 프로세스 종료 후 재시작

