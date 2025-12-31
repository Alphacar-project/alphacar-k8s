# 대시보드 Preview 표시 문제 해결

## ✅ 현재 상태 확인

Preview가 정상적으로 생성되었습니다:
- **Preview**: `frontend-97c78497c` (크리스마스 버전) ✅
- **Stable**: `frontend-668976b4cd` (이전 버전) ✅

---

## 🔧 대시보드에서 Preview 보는 방법

### 방법 1: 대시보드 새로고침

1. 브라우저에서 **강력 새로고침** (Ctrl+Shift+R 또는 Cmd+Shift+R)
2. 또는 F5 키 누르기

### 방법 2: 네임스페이스 확인

대시보드에서:
1. 상단 네임스페이스 필터 확인
2. `apc-fe-ns` 선택되어 있는지 확인
3. 또는 "All Namespaces" 선택

### 방법 3: frontend Rollout 클릭

1. `frontend` Rollout 카드 클릭
2. 상세 페이지에서 Revisions 확인
3. Preview 버전이 보여야 함

---

## 📊 대시보드에서 확인할 내용

### 메인 화면에서:
- `frontend` Rollout 카드
- Status: **Paused** (BlueGreenPause) - 정상
- Strategy: **BlueGreen**

### frontend 상세 페이지에서:
- **Revision 2**: Preview (크리스마스 버전)
- **Revision 1**: Stable/Active (이전 버전)

---

## 🎯 확인 방법

### 터미널에서 확인:
```bash
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns
```

**예상 출력**:
```
Images:  1.0.053-d53fade (stable, active)
         1.0.054-christmas (preview)  ← 이게 보여야 함
```

---

## 💡 문제 해결

### 대시보드가 업데이트 안 될 때:

1. **브라우저 캐시 삭제**
   - 개발자 도구 (F12) → Network 탭
   - "Disable cache" 체크
   - 새로고침

2. **대시보드 재시작**
   ```bash
   pkill -f "kubectl-argo-rollouts dashboard"
   kubectl-argo-rollouts dashboard --port 9003
   ```

3. **시크릿 모드로 접속**
   - 브라우저 시크릿 모드
   - http://localhost:9003/rollouts/

---

## ✅ 정리

- Preview는 정상 생성됨 ✅
- 대시보드 새로고침 필요
- frontend Rollout 클릭하여 상세 확인
- 네임스페이스 필터 확인

