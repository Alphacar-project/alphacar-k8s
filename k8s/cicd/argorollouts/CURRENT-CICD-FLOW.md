# 현재 CI/CD 자동화 플로우 분석

## 🔄 현재 자동화 흐름

### 1. GitHub Push → Jenkins 자동 트리거
```
GitHub Push (dev/alphacar/backend 변경)
    ↓
GenericTrigger Webhook
    ↓
Jenkins Pipeline 자동 시작
```

**설정 위치**: `Jenkinsfile`의 `triggers` 섹션
- `token: 'backend-token'` - GitHub Webhook에서 이 토큰으로 Jenkins 호출
- `regexpFilterExpression: '.*dev/alphacar/backend/.*'` - backend 폴더 변경 시만 트리거

### 2. Jenkins Pipeline 실행
```
1. Prepare (버전 생성)
    ↓
2. Security & Analysis (SonarQube, Trivy)
    ↓
3. Docker Build & Push (Harbor)
    ↓
4. Update Manifest (alphacar-k8s repo의 YAML 업데이트)
    ↓
5. Git Push (manifest repo에 변경사항 push)
```

### 3. ArgoCD 자동 배포
```
alphacar-k8s repo에 push
    ↓
ArgoCD가 자동으로 감지 (automated syncPolicy)
    ↓
k8s/backend 경로의 YAML 자동 배포
    ↓
Kubernetes에 Deployment 업데이트
```

## ✅ 현재 상태: **완전 자동화됨!**

- ✅ GitHub Push → Jenkins 자동 빌드
- ✅ Jenkins → Harbor 이미지 Push
- ✅ Jenkins → Manifest 업데이트 및 Push
- ✅ ArgoCD → 자동 배포

---

## 🎯 Argo Rollouts로 전환하기

현재는 **일반 Deployment**를 사용하고 있습니다.
**Argo Rollouts**로 전환하려면 다음이 필요합니다:

### 변경 사항

1. **Jenkinsfile 수정**
   - `k8s/backend/backend.yaml` 대신
   - `k8s/cicd/argorollouts/main-backend-rollout-bluegreen.yaml` 업데이트

2. **ArgoCD Application 수정**
   - `path: 'k8s/backend'` → `path: 'k8s/cicd/argorollouts'`

3. **Rollout YAML 배포**
   - 기존 Deployment를 Rollout으로 교체

---

## 🚀 Argo Rollouts 통합 방법

### 옵션 1: 기존 플로우 유지 (추천)

Jenkins가 Rollout YAML을 업데이트 → ArgoCD가 자동 배포

**장점:**
- 기존 자동화 플로우 유지
- ArgoCD의 자동 동기화 활용
- 변경 최소화

### 옵션 2: Jenkins에서 직접 배포

Jenkins가 kubectl로 직접 Rollout 배포

**장점:**
- ArgoCD 없이도 작동
- 더 빠른 배포

**단점:**
- ArgoCD의 GitOps 이점 상실
- Jenkins에 kubeconfig 필요

---

## 📝 전환 가이드

자세한 전환 방법은 `MIGRATION-GUIDE.md` 참고

