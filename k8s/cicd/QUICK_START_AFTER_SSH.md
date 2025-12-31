# EC2 SSH 연결 후 빠른 시작 가이드

## SSH 연결 후 바로 실행할 명령어

### 1. 현재 상태 확인

```bash
# 메모리 확인
free -h

# 디스크 확인
df -h

# Docker 확인
docker --version

# Kubernetes 확인
kubectl version --client
```

### 2. Kubernetes 설치 방법 선택

#### 옵션 A: k3s 설치 (간단, 빠름 - 추천)

```bash
# k3s 설치
curl -sfL https://get.k3s.io | sh -

# 확인
sudo k3s kubectl get nodes

# kubectl 설정
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
```

#### 옵션 B: kubeadm 설치 (표준 Kubernetes)

더 복잡하지만 표준 Kubernetes를 원하는 경우

```bash
# 설치 스크립트 실행
# (별도 가이드 참고)
```

### 3. 네임스페이스 생성

```bash
kubectl create namespace apc-cicd-ns
```

### 4. Jenkins Pod 배포

```bash
# 저장소 클론 또는 파일 업로드 후
cd /path/to/k8s/cicd/jenkins

# PVC 생성
kubectl apply -f jenkins-pvc.yaml

# Deployment & Service 배포
kubectl apply -f jenkins-deployment-k3s.yaml

# 상태 확인
kubectl get pods -n apc-cicd-ns -w
```

### 5. SonarQube Pod 배포

```bash
cd /path/to/k8s/cicd/sonarqube

# 배포
kubectl apply -f sonarqube-deployment-k3s.yaml

# 상태 확인
kubectl get pods -n apc-cicd-ns
kubectl get svc -n apc-cicd-ns
```

## 접속 주소

- **Jenkins**: http://43.201.105.210:30080
- **SonarQube**: http://43.201.105.210:32000

## 보안 그룹 설정 필요

AWS 콘솔에서 EC2 보안 그룹에 다음 포트 열기:
- 30080: Jenkins HTTP
- 30050: Jenkins JNLP  
- 32000: SonarQube

