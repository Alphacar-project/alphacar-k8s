# EC2 환경 확인: Kubernetes vs 일반 EC2

## 현재 상황 확인

### EC2 인스턴스 상태
- Jenkins 설치 방식: `apt install jenkins` (systemd 서비스)
- 설치 위치: `/var/lib/jenkins`
- 실행 방식: systemctl로 관리
- **Kubernetes 설치 여부: 확인 필요**

## Kubernetes 환경인지 확인 방법

EC2에서 다음 명령어로 확인:

```bash
# 1. kubectl 설치 확인
kubectl version --client

# 2. Kubernetes 클러스터 연결 확인
kubectl cluster-info

# 3. 노드 확인
kubectl get nodes

# 4. Pod 확인
kubectl get pods --all-namespaces

# 5. systemd 서비스 확인 (Kubernetes 관련)
systemctl list-units | grep -i kube
```

## 환경별 설치 방식

### 환경 1: 일반 EC2 인스턴스 (현재 상황으로 추정)

**특징:**
- Jenkins: systemd 서비스로 설치 (`apt install jenkins`)
- Kubernetes 없음
- Docker 없음 (또는 선택사항)

**설치 방식:**
- Jenkins: systemd 서비스 ✅ (이미 설치됨)
- SonarQube: systemd 서비스로 설치 권장

### 환경 2: Kubernetes 클러스터 (EC2에 k8s 설치됨)

**특징:**
- kubectl 명령어 사용 가능
- Pod, Deployment 등 k8s 리소스 사용
- Jenkins를 Pod로 실행

**설치 방식:**
- Jenkins: Kubernetes Deployment/Pod
- SonarQube: Kubernetes Deployment/Pod

### 환경 3: EKS (AWS 관리형 Kubernetes)

**특징:**
- AWS의 관리형 Kubernetes 서비스
- EC2 노드들이 클러스터 구성
- kubectl로 관리

**설치 방식:**
- Jenkins: Kubernetes 리소스 (Deployment, Service 등)
- SonarQube: Kubernetes 리소스

## 현재 환경 판단

### Jenkins 히스토리 분석

```bash
# Jenkins 설치 명령어
sudo apt install jenkins -y
sudo systemctl start jenkins
```

**결론:**
- ✅ systemd 서비스로 설치됨
- ✅ Kubernetes가 아닌 일반 EC2 인스턴스
- ✅ `/var/lib/jenkins` 디렉토리에 설치

## 답변

### Q: EC2에 Kubernetes 환경에서 Pod로 설치해야 하나요?

**A: 아닙니다!**

**이유:**
1. 현재 Jenkins는 systemd 서비스로 설치되어 있음
2. Kubernetes 환경이 아님 (일반 EC2 인스턴스)
3. Pod로 설치할 필요 없음
4. 현재 방식(systemd)이 맞음

### SonarQube도 같은 방식으로 설치

- ✅ systemd 서비스로 설치
- ✅ Jenkins와 동일한 방식
- ✅ Kubernetes/Pod 불필요

## 확인 명령어

EC2에서 실행하여 확인:

```bash
# Kubernetes 설치 여부 확인
kubectl version --client 2>&1

# 만약 "command not found"가 나오면 → Kubernetes 없음 (일반 EC2)
# 만약 버전이 나오면 → Kubernetes 있음 (확인 필요)
```

## 정리

| 항목 | 현재 환경 | 설치 방식 |
|------|----------|----------|
| **EC2 타입** | 일반 EC2 인스턴스 | - |
| **Jenkins** | systemd 서비스 | `apt install jenkins` ✅ |
| **Kubernetes** | 설치 안 됨 (추정) | - |
| **SonarQube** | 설치 예정 | systemd 서비스 권장 ✅ |

**결론: Pod로 설치할 필요 없습니다. systemd 서비스로 설치하는 것이 맞습니다!**

