# Dashboard 접속 가이드

## ✅ Dashboard 실행 완료

Dashboard가 정상적으로 실행 중입니다!

## 📋 접속 정보

**정확한 URL**: http://localhost:9003/rollouts/

> ⚠️ **주의**: `/rollouts/` 경로를 포함해야 합니다!

## 🚀 Dashboard 시작/중지

### 시작
```bash
cd /home/alphacar/alphacar-final/k8s/cicd/argorollouts
./start-dashboard.sh
```

또는 직접 실행:
```bash
kubectl-argo-rollouts dashboard --port 9003
```

### 중지
```bash
pkill -f "kubectl-argo-rollouts dashboard"
```

## 🔍 상태 확인

```bash
# 프로세스 확인
ps aux | grep "kubectl-argo-rollouts dashboard" | grep -v grep

# 포트 확인
netstat -tlnp | grep 9003
# 또는
ss -tlnp | grep 9003
```

## 📊 현재 포트 설정

| 포트 | 서비스 | URL |
|------|--------|-----|
| **9003** | Argo Rollouts Dashboard | http://localhost:9003/rollouts/ |
| **9001** | Blue (Active) | http://localhost:9001 |
| **9002** | Green (Preview) | http://localhost:9002 |

## 💡 문제 해결

### 접속이 안 될 때

1. **Dashboard 프로세스 확인**
   ```bash
   ps aux | grep "kubectl-argo-rollouts dashboard"
   ```

2. **포트 확인**
   ```bash
   netstat -tlnp | grep 9003
   ```

3. **로그 확인**
   ```bash
   cat /tmp/dashboard-9003.log
   ```

4. **재시작**
   ```bash
   pkill -f "kubectl-argo-rollouts dashboard"
   ./start-dashboard.sh
   ```

### 브라우저에서 확인

- **정확한 URL**: http://localhost:9003/rollouts/
- **강력 새로고침**: Ctrl+Shift+R (또는 Cmd+Shift+R)
- **시크릿 모드**: 캐시 문제 해결

