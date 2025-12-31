# ArgoCD vs Argo Rollouts 대시보드 가이드

## 📊 두 대시보드의 역할

### ArgoCD 대시보드
**역할:**
- ✅ GitOps 관리 (Git 저장소와 Kubernetes 동기화)
- ✅ Application 상태 확인
- ✅ Rollout **리소스** 자체는 볼 수 있음 (일반 Kubernetes 리소스로)
- ❌ Rollout의 **배포 전략 상세 정보**는 볼 수 없음
  - 트래픽 분할 상태 (10%, 25%, 50% 등)
  - 배포 단계 진행 상황
  - Blue-Green 전환 상태
  - Preview 버전 상태

### Argo Rollouts 대시보드
**역할:**
- ✅ Rollout 배포 전략 상세 정보
- ✅ 트래픽 분할 상태 시각화
- ✅ 배포 단계별 진행 상황
- ✅ Blue-Green 전환 상태
- ✅ Preview 버전 확인
- ✅ Promote/Rollback 제어

---

## 🎯 결론

**ArgoCD 대시보드에서:**
- Rollout 리소스가 배포되었는지 확인 가능
- Application 동기화 상태 확인
- 기본적인 Rollout 상태 확인

**Argo Rollouts 대시보드에서:**
- 배포 전략 상세 정보 확인
- 트래픽 분할 상태 확인
- 배포 제어 (Promote, Rollback 등)

**→ 두 대시보드를 함께 사용해야 합니다!**

---

## 🚀 사용 시나리오

### 시나리오 1: GitOps 관리 (ArgoCD)
```
1. ArgoCD 대시보드 접근
2. Application 상태 확인
3. Rollout 리소스가 정상 배포되었는지 확인
4. 동기화 상태 확인
```

### 시나리오 2: 배포 전략 관리 (Argo Rollouts)
```
1. Argo Rollouts 대시보드 접근
2. Rollout 배포 전략 확인
3. 트래픽 분할 상태 확인
4. Preview 버전 확인
5. Promote/Rollback 제어
```

---

## 📱 대시보드 접근 방법

### ArgoCD 대시보드
```bash
# Port Forward
kubectl port-forward -n argocd svc/argocd-server 8080:443

# 또는 NodePort/Ingress를 통한 접근
# 브라우저에서 접근
```

### Argo Rollouts 대시보드
```bash
# Port Forward
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 3100:3100

# 브라우저에서 http://localhost:3100 접근
```

---

## 🎬 영상 촬영 시나리오

### 화면 구성 옵션

#### 옵션 1: 분할 화면
- **왼쪽**: ArgoCD 대시보드 (GitOps 관리)
- **오른쪽**: Argo Rollouts 대시보드 (배포 전략)

#### 옵션 2: 순차 시연
1. **ArgoCD 대시보드**에서:
   - Application 상태 확인
   - Rollout 리소스 배포 확인
   - Git 동기화 상태 확인

2. **Argo Rollouts 대시보드**로 전환:
   - 배포 전략 상세 정보
   - 트래픽 분할 상태
   - Blue-Green 전환 시연

#### 옵션 3: Argo Rollouts 대시보드 중심
- Argo Rollouts 대시보드만 사용
- 배포 전략과 제어 기능에 집중
- GitOps는 CLI로 간단히 언급

---

## 💡 추천 워크플로우

### 개발자 관점
1. **코드 Push** → GitHub
2. **Jenkins 자동 빌드** (백그라운드)
3. **ArgoCD 대시보드**에서 동기화 확인
4. **Argo Rollouts 대시보드**에서 배포 전략 확인 및 제어

### 운영자 관점
1. **ArgoCD 대시보드**: 전체 Application 상태 모니터링
2. **Argo Rollouts 대시보드**: 개별 서비스 배포 전략 관리

---

## 🔧 통합 설정 (선택사항)

### ArgoCD에서 Argo Rollouts 링크 추가
ArgoCD Application에 annotation을 추가하여 Argo Rollouts 대시보드로 바로 이동할 수 있도록 설정 가능:

```yaml
metadata:
  annotations:
    argocd.argoproj.io/refresh: hard
    # Argo Rollouts 대시보드 링크 (수동으로 추가)
```

하지만 기본적으로는 두 대시보드를 별도로 사용하는 것이 일반적입니다.

---

## 📝 요약

| 기능 | ArgoCD 대시보드 | Argo Rollouts 대시보드 |
|------|----------------|----------------------|
| GitOps 관리 | ✅ | ❌ |
| Application 상태 | ✅ | ❌ |
| Rollout 리소스 확인 | ✅ (기본 정보만) | ✅ |
| 배포 전략 상세 | ❌ | ✅ |
| 트래픽 분할 상태 | ❌ | ✅ |
| 배포 제어 | ❌ | ✅ |

**결론: 두 대시보드를 함께 사용하세요!**

