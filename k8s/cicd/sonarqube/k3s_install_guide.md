# EC2에 k3s 설치 가이드 (SonarQube Pod 설치 전)

## k3s란?

- 경량 Kubernetes 배포판
- 단일 바이너리 (약 50MB)
- 단일 노드에 적합
- 리소스 사용량 적음 (8GB RAM EC2에 적합)

## 설치 방법

### 1. k3s 설치

```bash
# k3s 설치 (단일 노드)
curl -sfL https://get.k3s.io | sh -

# 설치 확인
sudo k3s kubectl get nodes
```

### 2. kubectl 설정

```bash
# kubectl 명령어 사용 가능하도록 설정
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config

# 또는 k3s kubectl alias 생성
echo 'alias kubectl="sudo k3s kubectl"' >> ~/.bashrc
source ~/.bashrc

# 확인
kubectl get nodes
```

### 3. k3s 상태 확인

```bash
# 서비스 상태
sudo systemctl status k3s

# 노드 확인
kubectl get nodes

# 모든 리소스 확인
kubectl get all --all-namespaces
```

## 리소스 사용량

k3s는 매우 가볍습니다:
- 메모리: 약 200-300MB
- CPU: 최소 사용
- 8GB RAM EC2에서 Jenkins + k3s + SonarQube 모두 가능

## SonarQube Pod 설치

k3s 설치 후:
1. SonarQube Deployment YAML 작성
2. PVC (영구 저장소) 생성
3. Service 생성
4. kubectl apply로 배포

## 장점

- ✅ 경량 (리소스 효율적)
- ✅ 빠른 설치 (약 1-2분)
- ✅ 실제 Kubernetes와 호환
- ✅ EKS 마이그레이션 시 YAML 그대로 사용 가능
- ✅ ArgoCD 연동 가능

## 주의사항

- 단일 노드 환경 (고가용성 없음)
- 개발/테스트 환경에 적합
- 프로덕션은 EKS 권장

