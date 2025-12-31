# Argo Rollouts 전환 가이드

## 현재 → Argo Rollouts 전환 방법

## 현재 상태

- ✅ Jenkins: GitHub Push → 자동 빌드
- ✅ Jenkins: Harbor에 이미지 Push
- ✅ Jenkins: `alphacar-k8s` repo의 `k8s/backend/backend.yaml` 업데이트
- ✅ ArgoCD: `k8s/backend` 경로 자동 배포
- ✅ 일반 Deployment 사용

## 목표 상태

- ✅ Jenkins: GitHub Push → 자동 빌드 (동일)
- ✅ Jenkins: Harbor에 이미지 Push (동일)
- ✅ Jenkins: `alphacar-k8s` repo의 `k8s/cicd/argorollouts/main-backend-rollout-bluegreen.yaml` 업데이트
- ✅ ArgoCD: `k8s/cicd/argorollouts` 경로 자동 배포
- ✅ Argo Rollouts (Blue-Green) 사용

---

## 전환 단계

### Step 1: Argo Rollouts 설치

```bash
cd /home/alphacar/alphacar-final/k8s/cicd/argorollouts
./install-argo-rollouts.sh
```

### Step 2: Rollout YAML을 manifest repo에 추가

```bash
# alphacar-k8s repo에 Rollout 파일 추가
# k8s/cicd/argorollouts/main-backend-rollout-bluegreen.yaml
```

### Step 3: Jenkinsfile 수정

**기존** (`k8s/cicd/jenkins/Jenkinsfile`):
```groovy
def yamlPath = "k8s/backend/backend.yaml"
```

**변경** (`k8s/cicd/jenkins/Jenkinsfile.ArgoRollouts` 사용 또는 기존 파일 수정):
```groovy
def rolloutPath = "k8s/cicd/argorollouts/main-backend-rollout-bluegreen.yaml"
```

### Step 4: ArgoCD Application 수정

**기존** (`k8s/cicd/argocd/backend-app.yaml`):
```yaml
path: 'k8s/backend'
```

**변경**:
```yaml
path: 'k8s/cicd/argorollouts'
```

또는 **새로운 Application 생성** (기존과 병행):
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: main-backend-rollout
  namespace: apc-cicd-ns
spec:
  project: default
  source:
    repoURL: 'https://github.com/Alphacar-project/alphacar-k8s.git'
    targetRevision: main
    path: 'k8s/cicd/argorollouts'  # Rollout 경로
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: apc-be-ns
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Step 5: 기존 Deployment 제거 (선택사항)

Rollout이 정상 작동하는지 확인한 후 기존 Deployment 제거:

```bash
kubectl delete deployment main-backend -n apc-be-ns
```

---

## 빠른 전환 스크립트

### 방법 1: Jenkinsfile만 수정 (기존 플로우 유지)

```bash
# Jenkinsfile 수정
# k8s/cicd/jenkins/Jenkinsfile의 107번째 줄 수정
sed -i 's|k8s/backend/backend.yaml|k8s/cicd/argorollouts/main-backend-rollout-bluegreen.yaml|' \
  /home/alphacar/alphacar-final/k8s/cicd/jenkins/Jenkinsfile

# 이미지 경로도 수정 필요
sed -i 's|image: .*/backend:.*|image: ${HARBOR_URL}/${HARBOR_PROJECT}/alphacar-main:${env.FULL_VERSION}|' \
  # (실제로는 Jenkinsfile 내부에서 sed 명령어 수정 필요)
```

### 방법 2: 새로운 Jenkinsfile 사용

```bash
# Jenkins에서 새로운 Pipeline 생성
# Jenkinsfile 경로: k8s/cicd/jenkins/Jenkinsfile.ArgoRollouts
```

---

## 테스트 방법

### 1. 수동 테스트
```bash
# Rollout 직접 배포
kubectl apply -f main-backend-rollout-bluegreen.yaml

# 이미지 업데이트
kubectl argo rollouts set image main-backend \
  main-backend=192.168.0.170:30000/alphacar/alphacar-main:1.0.33-test \
  -n apc-be-ns

# 상태 확인
kubectl argo rollouts get rollout main-backend -n apc-be-ns
```

### 2. 자동화 테스트
```bash
# GitHub에 테스트 변경사항 push
# → Jenkins 자동 빌드 확인
# → ArgoCD 자동 배포 확인
```

---

## 롤백 방법

문제 발생 시 즉시 롤백:

```bash
# 1. ArgoCD Application 원복
kubectl apply -f k8s/cicd/argocd/backend-app.yaml

# 2. Jenkinsfile 원복
git checkout k8s/cicd/jenkins/Jenkinsfile

# 3. Rollout 제거
kubectl delete rollout main-backend -n apc-be-ns

# 4. 기존 Deployment 복구
kubectl apply -f k8s/backend/deploy/main-backend.yaml
```

---

## 주의사항

1. **서비스 중단 방지**
   - Rollout 배포 전에 Service가 정상 작동하는지 확인
   - Blue-Green 전환 시 트래픽 라우팅 확인

2. **리소스 충분성**
   - Blue-Green 배포는 일시적으로 2배 리소스 필요
   - HPA 설정 확인

3. **Istio 설정**
   - VirtualService, DestinationRule 정확히 설정
   - Gateway와 호스트 일치 확인

---

## 체크리스트

전환 전 확인:
- [ ] Argo Rollouts 설치 완료
- [ ] Rollout YAML 파일 준비
- [ ] Jenkinsfile 수정 또는 새 파일 사용
- [ ] ArgoCD Application 수정 또는 새 Application 생성
- [ ] Service, DestinationRule, VirtualService 설정 확인
- [ ] 테스트 환경에서 먼저 검증

전환 후 확인:
- [ ] Rollout 정상 배포 확인
- [ ] Blue-Green 전환 테스트
- [ ] 트래픽 라우팅 확인
- [ ] 롤백 테스트
- [ ] 자동화 플로우 전체 테스트

