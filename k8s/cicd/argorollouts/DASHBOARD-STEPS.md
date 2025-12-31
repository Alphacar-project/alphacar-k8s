# Argo Rollouts 대시보드 접근 단계별 가이드

## 🎯 답변: 네, 미리 들어가세요!

**대시보드를 미리 열어두는 것을 추천합니다!**

---

## 📋 단계별 가이드

### Step 1: 대시보드 실행 (별도 터미널)

**새 터미널 창을 열고:**

```bash
kubectl argo rollouts dashboard
```

**출력:**
```
Argo Rollouts Dashboard is now available at http://localhost:3100
```

**이 터미널은 그대로 두세요!** (종료하지 마세요)

---

### Step 2: 브라우저에서 접근

**브라우저에서:**
- http://localhost:3100 접근
- Argo Rollouts 대시보드 화면 확인

---

### Step 3: 배포 시연 준비 완료!

이제 대시보드가 열려있는 상태에서:

**다른 터미널에서 배포 명령어 실행:**
```bash
# 새 버전 배포
kubectl argo rollouts set image frontend \
  frontend=192.168.0.170:30000/alphacar/frontend:1.0.054-christmas \
  -n apc-fe-ns
```

**대시보드에서 실시간으로 변화 확인!**

---

## 🎬 영상 촬영 시나리오

### 추천 화면 구성

**화면 1:** Argo Rollouts 대시보드 (미리 열어둠)
- http://localhost:3100
- Rollout 상태 실시간 모니터링

**화면 2:** 터미널
- CLI 명령어 실행
- 상태 확인

**화면 3 (선택):** 브라우저
- 실제 웹사이트 (https://alphacar.cloud)
- Hello 크리스마스 확인

---

## 💡 팁

### 대시보드를 백그라운드로 실행 (선택사항)

```bash
# 백그라운드로 실행
kubectl argo rollouts dashboard &

# 프로세스 확인
jobs

# 종료하려면
fg  # 포그라운드로 가져오기
Ctrl+C  # 종료
```

### 여러 터미널 사용

**터미널 1:** 대시보드 (계속 실행)
```bash
kubectl argo rollouts dashboard
```

**터미널 2:** 배포 명령어
```bash
kubectl argo rollouts set image ...
kubectl argo rollouts promote ...
```

**터미널 3:** 상태 확인
```bash
watch kubectl argo rollouts get rollout frontend -n apc-fe-ns
```

---

## ✅ 체크리스트

시연 전:
- [ ] 대시보드 실행 (`kubectl argo rollouts dashboard`)
- [ ] 브라우저에서 http://localhost:3100 접근 확인
- [ ] Rollout 목록 확인 (아직 없을 수 있음 - 정상)
- [ ] 대시보드 화면 준비 완료!

시연 중:
- [ ] 새 버전 배포 후 대시보드에서 Rollout 생성 확인
- [ ] Preview 버전 생성 확인
- [ ] Promote 후 트래픽 전환 확인
- [ ] 롤백 후 상태 복구 확인

---

## 🚀 지금 바로 시작!

**터미널 1에서:**
```bash
kubectl argo rollouts dashboard
```

**브라우저에서:**
- http://localhost:3100 접근

**준비 완료!** 이제 배포 시연을 시작할 수 있습니다!

