# 자동 배포 현황 요약

## ✅ 현재 상태: **완전 자동화됨!**

### 자동화 플로우

```
1. GitHub Push (dev/alphacar/backend 변경)
   ↓
2. Jenkins 자동 트리거 (GenericTrigger webhook)
   ↓
3. Jenkins Pipeline 실행
   - 빌드
   - Harbor에 이미지 Push
   - alphacar-k8s repo의 YAML 업데이트
   - Git Push
   ↓
4. ArgoCD 자동 감지 (automated syncPolicy)
   ↓
5. Kubernetes에 자동 배포
```

## 🎯 Argo Rollouts 전환 후에도 동일하게 작동!

### 변경된 부분만

**기존:**
- Jenkins → `k8s/backend/backend.yaml` 업데이트
- ArgoCD → `k8s/backend` 경로 배포
- 일반 Deployment 사용

**변경 후:**
- Jenkins → `k8s/cicd/argorollouts/main-backend-rollout-bluegreen.yaml` 업데이트
- ArgoCD → `k8s/cicd/argorollouts` 경로 배포
- Argo Rollouts (Blue-Green) 사용

### 자동화는 그대로 유지! ✅

- ✅ GitHub Push → 자동 빌드 (변경 없음)
- ✅ Jenkins → Harbor Push (변경 없음)
- ✅ Jenkins → Manifest 업데이트 (경로만 변경)
- ✅ ArgoCD → 자동 배포 (경로만 변경)
- ✅ **추가**: Blue-Green 배포 전략 적용!

---

## 🚀 전환 방법

### 빠른 전환 (5분)

1. **Argo Rollouts 설치**
   ```bash
   cd /home/alphacar/alphacar-final/k8s/cicd/argorollouts
   ./install-argo-rollouts.sh
   ```

2. **Rollout 파일을 manifest repo에 추가**
   - `alphacar-k8s` repo의 `k8s/cicd/argorollouts/` 경로에 추가
   - 또는 이미 추가되어 있다면 확인만

3. **Jenkinsfile 업데이트** (이미 수정됨)
   - `k8s/backend/backend.yaml` → `k8s/cicd/argorollouts/main-backend-rollout-bluegreen.yaml`

4. **ArgoCD Application 추가**
   ```bash
   kubectl apply -f /home/alphacar/alphacar-final/k8s/cicd/argocd/main-backend-rollout-app.yaml
   ```

5. **테스트**
   - GitHub에 push → 자동 배포 확인!

---

## 📊 배포 전략 비교

### 기존 (일반 Deployment)
- 즉시 배포
- 롤백 시 전체 재배포 필요
- 다운타임 가능성

### Argo Rollouts (Blue-Green)
- Preview 버전 먼저 배포
- 테스트 후 승인 시 전환
- 즉시 롤백 가능
- 제로 다운타임

---

## ⚠️ 주의사항

1. **기존 Deployment와 병행 가능**
   - Rollout 배포 후 기존 Deployment 제거
   - 또는 점진적 전환

2. **Service 유지**
   - 기존 Service는 그대로 사용 가능
   - Rollout의 selector와 일치 확인

3. **ArgoCD 동기화**
   - 두 Application이 동시에 배포되지 않도록 주의
   - 기존 `backend-app.yaml`의 path 변경 또는 비활성화

---

## 🎬 영상 촬영 시나리오

### 시나리오 1: 자동 배포 시연
1. GitHub에 코드 변경 push
2. Jenkins 자동 빌드 시작 (대시보드 확인)
3. ArgoCD 자동 배포 시작 (대시보드 확인)
4. Argo Rollouts 대시보드에서 Blue-Green 전환 확인
5. 승인 (Promote) 또는 롤백 시연

### 시나리오 2: 수동 배포 시연
1. Argo Rollouts 대시보드 열기
2. 수동으로 이미지 업데이트
3. Preview 버전 생성 확인
4. 승인 (Promote) 시연
5. 롤백 시연

---

## 📝 체크리스트

전환 전:
- [x] Jenkinsfile 수정 완료
- [ ] Argo Rollouts 설치
- [ ] Rollout 파일 manifest repo에 추가
- [ ] ArgoCD Application 생성
- [ ] 테스트 환경에서 검증

전환 후:
- [ ] 자동 배포 플로우 테스트
- [ ] Blue-Green 전환 확인
- [ ] 롤백 테스트
- [ ] 기존 Deployment 제거 (선택)

