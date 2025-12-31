# 영상 촬영용 명령어 모음

## 🎬 빠른 참조 - 복사해서 사용하세요!

---

## Part 1: Frontend 롤백 시연

### 1. 현재 상태 확인
```bash
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns
```

### 2. 롤백 실행
```bash
kubectl-argo-rollouts undo frontend -n apc-fe-ns
```

### 3. Preview 확인 (선택사항)
```bash
kubectl port-forward -n apc-fe-ns svc/frontend-preview 8083:8000
```
브라우저: http://localhost:8083

### 4. Promote (프로덕션 전환)
```bash
kubectl-argo-rollouts promote frontend -n apc-fe-ns
```

### 5. 최종 확인
```bash
kubectl-argo-rollouts get rollout frontend -n apc-fe-ns
```
브라우저: https://alphacar.cloud

---

## Part 2: Rollouts-demo 색상 변화 시연

### 1. Green 버전 배포
```bash
kubectl-argo-rollouts set image rollouts-demo \
  rollouts-demo=argoproj/rollouts-demo:green \
  -n rollouts-demo
```

### 2. Preview 확인
브라우저: http://localhost:9002 (초록색 그리드)

### 3. Promote (Blue → Green)
```bash
kubectl-argo-rollouts promote rollouts-demo -n rollouts-demo
```

### 4. 롤백 (Green → Blue)
```bash
kubectl-argo-rollouts undo rollouts-demo -n rollouts-demo
```

---

## 🎥 영상 촬영 순서 (타이밍)

### Scene 1: 초기 상태 (5초)
- 대시보드: frontend Rollout 확인
- 브라우저: https://alphacar.cloud → "Hello 크리스마스 🎄" 확인
- **명령어:** 없음

### Scene 2: 롤백 시작 (10초)
- 터미널: `kubectl-argo-rollouts undo frontend -n apc-fe-ns`
- 대시보드: 롤백 진행 확인
- **대기:** 5초

### Scene 3: Preview 확인 (15초)
- 터미널: `kubectl port-forward -n apc-fe-ns svc/frontend-preview 8083:8000`
- 브라우저: http://localhost:8083 → "Hello 크리스마스" 없음 확인
- **대기:** 3초

### Scene 4: Promote (10초)
- 대시보드: "Promote" 버튼 클릭
- 또는 터미널: `kubectl-argo-rollouts promote frontend -n apc-fe-ns`
- 브라우저: https://alphacar.cloud 새로고침 → "Hello 크리스마스" 사라짐
- **대기:** 5초

### Scene 5: Rollouts-demo 초기 (5초)
- 브라우저: http://localhost:9001 → 파란색 그리드
- **명령어:** 없음

### Scene 6: Green 배포 (10초)
- 터미널: `kubectl-argo-rollouts set image rollouts-demo rollouts-demo=argoproj/rollouts-demo:green -n rollouts-demo`
- 대시보드: Preview 생성 확인
- **대기:** 5초

### Scene 7: Preview 확인 (10초)
- 브라우저: http://localhost:9001 (파란색) vs http://localhost:9002 (초록색)
- **대기:** 3초

### Scene 8: Promote (10초)
- 대시보드: "Promote" 버튼 클릭
- 또는 터미널: `kubectl-argo-rollouts promote rollouts-demo -n rollouts-demo`
- 브라우저: http://localhost:9001 새로고침 → 초록색으로 변경
- **대기:** 5초

### Scene 9: 롤백 (10초)
- 대시보드: "Abort" 버튼 클릭
- 또는 터미널: `kubectl-argo-rollouts undo rollouts-demo -n rollouts-demo`
- 브라우저: http://localhost:9001 새로고침 → 파란색으로 복구
- **대기:** 5초

---

## 📋 체크리스트

### 촬영 전 준비
- [ ] Argo Rollouts 대시보드 실행 (`kubectl-argo-rollouts dashboard` 또는 http://localhost:9003)
- [ ] 브라우저 탭 준비:
  - [ ] https://alphacar.cloud
  - [ ] http://localhost:9001 (rollouts-demo Active/Blue)
  - [ ] http://localhost:9002 (rollouts-demo Preview/Green)
- [ ] 명령어 복사 준비
- [ ] 현재 상태 확인

### 촬영 중
- [ ] 각 명령어 실행 후 대기 시간 확보
- [ ] 대시보드와 브라우저 동시 확인
- [ ] 설명 포인트 준비

---

## 💡 팁

### 명령어 실행 순서
1. 명령어 복사
2. 터미널에 붙여넣기
3. Enter
4. 대기 (3-5초)
5. 결과 확인

### 설명 포인트
- "현재 Hello 크리스마스가 있습니다"
- "롤백을 실행합니다"
- "Preview에서 확인합니다"
- "Promote로 프로덕션 전환합니다"
- "색상이 파란색에서 초록색으로 변경되었습니다"
- "롤백으로 다시 파란색으로 복구되었습니다"

