# 대시보드 Preview 표시 문제 해결

## 🔧 대시보드 재시작 완료

대시보드를 재시작했습니다. 다음을 확인하세요:

---

## ✅ 확인 방법

### 1. 브라우저에서 접속
- http://localhost:9003/rollouts/
- **강력 새로고침** (Ctrl+Shift+R)

### 2. 네임스페이스 필터 확인
대시보드 상단에서:
- 네임스페이스 필터가 `apc-fe-ns`로 설정되어 있는지 확인
- 또는 "All Namespaces" 선택

### 3. frontend Rollout 클릭
1. `frontend` Rollout 카드 클릭
2. 상세 페이지로 이동
3. Revisions 섹션 확인:
   - **Revision 2**: Preview (크리스마스 버전)
   - **Revision 1**: Stable/Active (이전 버전)

---

## 📊 현재 상태 (터미널 확인)

```bash
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns
```

**예상 출력**:
```
Images:  1.0.053-d53fade (stable, active)
         1.0.054-christmas (preview)  ← Preview 있음!
```

---

## 🎯 대시보드에서 Preview 확인하는 방법

### 방법 1: 메인 화면
- `frontend` Rollout 카드에서 Status 확인
- **Paused** (BlueGreenPause) 상태면 Preview 있음

### 방법 2: 상세 페이지
1. `frontend` 클릭
2. Revisions 섹션 확인
3. Preview로 표시된 Revision 확인

### 방법 3: Summary 카드
- Summary 카드에서 Images 확인
- 두 개의 이미지가 보여야 함 (stable, preview)

---

## 💡 문제가 계속되면

### 대시보드 완전 재시작
```bash
# 1. 기존 프로세스 종료
pkill -9 -f "kubectl-argo-rollouts dashboard"

# 2. 재시작
kubectl-argo-rollouts dashboard --port 9003
```

### 브라우저 완전 초기화
1. 브라우저 완전 종료
2. 캐시 삭제
3. 다시 접속

---

## ✅ 정리

- 대시보드 재시작 완료 ✅
- Preview는 정상 생성됨 ✅
- 브라우저 강력 새로고침 필요
- frontend Rollout 클릭하여 상세 확인
