# 포트 포워딩 수정 완료

## ✅ 해결된 문제

1. **Dashboard (9000) 포트 포워딩 추가**
2. **Green 버전 배포 완료** - 이제 Blue와 Green이 구분됩니다
3. **포트 포워딩 재시작** - 모든 포트가 정상 작동합니다

---

## 📋 현재 포트 설정

| 포트 | 서비스 | 설명 |
|------|--------|------|
| **9003** | Argo Rollouts Dashboard | http://localhost:9003 |
| **9001** | rollouts-demo-active (Blue) | http://localhost:9001 |
| **9002** | rollouts-demo-preview (Green) | http://localhost:9002 |

---

## 🔍 확인 사항

### 1. 브라우저 캐시 지우기
브라우저에서 **강력 새로고침** (Ctrl+Shift+R 또는 Cmd+Shift+R)을 해주세요.

### 2. 색상 확인
- **9001 (Blue)**: 파란색 그리드
- **9002 (Green)**: 초록색 그리드

### 3. Dashboard 접속
- **9003**: Argo Rollouts Dashboard
- 네임스페이스 필터: `rollouts-demo`, `apc-fe-ns`

---

## 🚀 포트 포워딩 재시작 명령어

모든 포트를 재시작하려면:

```bash
cd /home/alphacar/alphacar-final/k8s/cicd/argorollouts
./start-ports.sh
```

또는 개별적으로:

```bash
# Dashboard
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 9003:3100 --address=0.0.0.0 &

# Blue
kubectl port-forward -n rollouts-demo svc/rollouts-demo-active 9001:80 --address=0.0.0.0 &

# Green
kubectl port-forward -n rollouts-demo svc/rollouts-demo-preview 9002:80 --address=0.0.0.0 &
```

---

## 🔧 문제 해결

### 여전히 둘 다 파란색이 보인다면:

1. **브라우저 캐시 완전 삭제**
   - 개발자 도구 (F12) → Network 탭 → "Disable cache" 체크
   - 또는 시크릿 모드로 접속

2. **포트 포워딩 상태 확인**
   ```bash
   ps aux | grep "port-forward.*900" | grep -v grep
   ```

3. **서비스 상태 확인**
   ```bash
   kubectl-argo-rollouts get rollout rollouts-demo -n rollouts-demo
   ```

4. **Green 버전 재배포**
   ```bash
   kubectl-argo-rollouts set image rollouts-demo \
     rollouts-demo=argoproj/rollouts-demo:green \
     -n rollouts-demo
   ```

---

## 📊 현재 Rollout 상태

```bash
kubectl-argo-rollouts get rollout rollouts-demo -n rollouts-demo
```

예상 결과:
- **Stable/Active**: Blue (revision:3)
- **Preview**: Green (revision:4)

---

## 💡 팁

- **강력 새로고침**: Ctrl+Shift+R (Windows/Linux) 또는 Cmd+Shift+R (Mac)
- **시크릿 모드**: 캐시 없이 테스트 가능
- **개발자 도구**: F12 → Network 탭에서 실제 요청 확인

