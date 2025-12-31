# ArgoCD vs Argo Rollouts 대시보드 비교

## 📊 간단 답변

**ArgoCD 대시보드에서 Argo Rollouts를 볼 수 있나요?**

### ✅ 볼 수 있는 것
- Rollout **리소스 자체**는 볼 수 있습니다
- Application에 포함된 Rollout의 기본 상태
- Pod 수, 리소스 사용량 등 기본 정보

### ❌ 볼 수 없는 것
- **배포 전략 상세 정보** (Canary 단계, 트래픽 분할 등)
- **Blue-Green 전환 상태** (Preview 버전 상태)
- **배포 제어 기능** (Promote, Rollback 버튼)

---

## 🎯 실제 사용 예시

### ArgoCD 대시보드에서 보이는 것:
```
Application: main-backend-rollout
├── Rollout: main-backend
│   ├── Status: Healthy
│   ├── Pods: 2/2
│   └── Resources: ...
└── Service: main-backend-stable
```

### Argo Rollouts 대시보드에서 보이는 것:
```
Rollout: main-backend
├── 배포 전략: Blue-Green
├── 현재 단계: Preview 배포 완료
├── 트래픽 분할:
│   ├── Stable: 100%
│   └── Preview: 0% (대기 중)
├── Pods:
│   ├── Stable: 1 pod (v1.0.32)
│   └── Preview: 1 pod (v1.0.33)
└── Actions:
    ├── [Promote] 버튼
    └── [Rollback] 버튼
```

---

## 💡 결론

**두 대시보드를 함께 사용하세요!**

1. **ArgoCD 대시보드**: GitOps 관리, 전체 Application 상태
2. **Argo Rollouts 대시보드**: 배포 전략 상세 관리, 배포 제어

---

## 🚀 빠른 시작

### ArgoCD 대시보드
```bash
kubectl port-forward -n argocd svc/argocd-server 8080:443
# https://localhost:8080
```

### Argo Rollouts 대시보드
```bash
# 방법 1: UI Deployment 사용
kubectl apply -f argo-rollouts-ui.yaml
kubectl port-forward -n argo-rollouts svc/argo-rollouts-ui 3100:3100
# http://localhost:3100

# 방법 2: CLI 직접 사용 (로컬)
kubectl argo rollouts dashboard
# http://localhost:3100
```

---

## 🎬 영상 촬영 추천

### 추천 시나리오: Argo Rollouts 대시보드 중심

1. **Argo Rollouts 대시보드 열기**
2. **Rollout 상태 확인** (배포 전략, 트래픽 분할)
3. **새 버전 배포** (이미지 업데이트)
4. **Preview 버전 확인**
5. **Promote 시연** (Blue → Green 전환)
6. **롤백 시연**

**ArgoCD는 간단히 언급만:**
- "GitOps는 ArgoCD가 자동으로 관리합니다"
- "ArgoCD 대시보드에서도 확인 가능하지만, 배포 전략 상세 관리는 Argo Rollouts 대시보드에서 합니다"

---

## 📝 요약 표

| 기능 | ArgoCD | Argo Rollouts |
|------|--------|---------------|
| GitOps 관리 | ✅ | ❌ |
| Rollout 리소스 확인 | ✅ (기본) | ✅ (상세) |
| 배포 전략 상세 | ❌ | ✅ |
| 트래픽 분할 상태 | ❌ | ✅ |
| 배포 제어 | ❌ | ✅ |
| 실시간 모니터링 | ✅ (기본) | ✅ (상세) |

**→ 영상 촬영에는 Argo Rollouts 대시보드가 필수입니다!**

