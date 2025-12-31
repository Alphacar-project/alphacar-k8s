# 빠른 시작 가이드

## 🎬 영상 촬영용 빠른 시작 (수동 배포)

### 1단계: Argo Rollouts 설치
```bash
cd /home/alphacar/alphacar-final/k8s/cicd/argorollouts
./install-argo-rollouts.sh
```

### 2단계: Argo Rollouts UI 실행
```bash
# 별도 터미널에서
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 3100:3100
```

브라우저에서 `http://localhost:3100` 접근

### 3단계: Blue-Green 배포 적용
```bash
kubectl apply -f main-backend-rollout-bluegreen.yaml
```

### 4단계: 영상 촬영 시작! 🎥

#### 시나리오 A: 수동 배포 데모
```bash
# 1. 현재 상태 확인
kubectl argo rollouts get rollout main-backend -n apc-be-ns

# 2. 새 버전 배포
kubectl argo rollouts set image main-backend \
  main-backend=192.168.0.170:30000/alphacar/alphacar-main:1.0.33-demo \
  -n apc-be-ns

# 3. 대시보드에서 Preview 버전 확인

# 4. 승인 (Promote)
kubectl argo rollouts promote main-backend -n apc-be-ns

# 5. 롤백 (필요시)
kubectl argo rollouts undo main-backend -n apc-be-ns
```

#### 시나리오 B: 자동화 스크립트 사용
```bash
./demo-script.sh 1.0.33-demo
```

---

## 🚀 완전한 CI/CD 파이프라인 (Jenkins 통합)

### 1단계: Jenkinsfile 설정
```bash
# Jenkins에서 새로운 Pipeline 생성
# Jenkinsfile 경로: k8s/cicd/jenkins/Jenkinsfile.ArgoRollouts
```

### 2단계: Jenkins Credentials 설정
필요한 Credentials:
- `harbor-cred`: Harbor 로그인 정보
- `github-cred`: GitHub 접근 토큰
- Kubernetes kubeconfig (Jenkins에서 kubectl 접근용)

### 3단계: Jenkins Pipeline 실행
1. Jenkins 웹 UI 접근
2. 새로운 Pipeline Job 생성
3. `Jenkinsfile.ArgoRollouts` 사용
4. 파라미터 선택:
   - ACTION: `build_and_deploy`
   - DEPLOY_STRATEGY: `blue-green`
5. 빌드 실행

### 4단계: Argo Rollouts 대시보드에서 배포 과정 확인

---

## 📊 대시보드 접근 방법

### 로컬 접근 (Port Forward)
```bash
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 3100:3100
```
→ `http://localhost:3100`

### Istio Gateway를 통한 접근
1. Gateway에 도메인 추가 필요
2. `http://rollouts.alphacar.cloud` 접근

---

## 🎯 추천 워크플로우

### 영상 촬영용 (빠른 데모)
1. ✅ 수동 배포로 시작
2. ✅ 대시보드에서 배포 과정 시연
3. ✅ Blue-Green 전환 시연
4. ✅ 롤백 시연

### 완전한 데모용 (나중에)
1. Jenkins CI 파이프라인 구축
2. 코드 변경 → 자동 빌드 → 자동 배포 전체 흐름 시연

---

## ⚡ 빠른 참조 명령어

```bash
# Rollout 상태 확인
kubectl argo rollouts get rollout main-backend -n apc-be-ns

# 실시간 모니터링
watch kubectl argo rollouts get rollout main-backend -n apc-be-ns

# 새 버전 배포
kubectl argo rollouts set image main-backend \
  main-backend=NEW_IMAGE_TAG -n apc-be-ns

# 승인 (Promote)
kubectl argo rollouts promote main-backend -n apc-be-ns

# 롤백
kubectl argo rollouts undo main-backend -n apc-be-ns

# Pod 상태 확인
kubectl get pods -n apc-be-ns -l app=main-backend

# VirtualService 확인
kubectl get virtualservice main-backend-vs -n apc-be-ns -o yaml
```

