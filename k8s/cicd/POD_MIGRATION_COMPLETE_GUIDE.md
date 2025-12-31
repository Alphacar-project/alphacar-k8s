# Jenkins & SonarQube Pod 전환 완전 가이드

## 목표

- Jenkins: systemd → Pod 전환
- SonarQube: Pod로 설치
- k3s 환경 구축
- EKS 마이그레이션 준비 완료

## 작업 순서

### Step 1: k3s 설치

```bash
# k3s 설치 스크립트 실행
cd /path/to/k8s/cicd/k3s
chmod +x install-k3s.sh
./install-k3s.sh

# 또는 수동 설치
curl -sfL https://get.k3s.io | sh -
sudo k3s kubectl get nodes

# kubectl 설정
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
```

### Step 2: 네임스페이스 생성

```bash
kubectl create namespace apc-cicd-ns
```

### Step 3: Jenkins Pod 전환

#### 3-1. 데이터 백업

```bash
# Jenkins 데이터 백업
sudo tar -czf ~/jenkins-backup-$(date +%Y%m%d).tar.gz /var/lib/jenkins
```

#### 3-2. PVC 생성

```bash
cd /path/to/k8s/cicd/jenkins
kubectl apply -f jenkins-pvc.yaml
kubectl get pvc -n apc-cicd-ns
```

#### 3-3. 기존 Jenkins 중지

```bash
sudo systemctl stop jenkins
sudo systemctl disable jenkins
```

#### 3-4. Jenkins Pod 배포

```bash
kubectl apply -f jenkins-deployment-k3s.yaml
kubectl get pods -n apc-cicd-ns -w
```

#### 3-5. 데이터 마이그레이션 (선택사항)

Pod가 Running 상태가 되면:

```bash
# 방법 1: kubectl cp 사용
POD_NAME=$(kubectl get pods -n apc-cicd-ns -l app=jenkins -o jsonpath='{.items[0].metadata.name}')
kubectl cp /var/lib/jenkins $POD_NAME:/var/jenkins_home -n apc-cicd-ns

# 방법 2: 처음부터 새로 설정 (권장 - 깔끔하게 시작)
# Jenkins 초기 설정을 다시 진행
```

#### 3-6. Jenkins 접속 확인

```bash
# Jenkins 접속
http://<EC2-IP>:30080
# 또는
http://<EC2-IP>:8080 (NodePort 30080 사용)

# Pod 로그 확인
kubectl logs -f -n apc-cicd-ns -l app=jenkins
```

### Step 4: SonarQube Pod 설치

#### 4-1. SonarQube 배포

```bash
cd /path/to/k8s/cicd/sonarqube
kubectl apply -f sonarqube-deployment-k3s.yaml
kubectl get pods -n apc-cicd-ns -w
```

#### 4-2. SonarQube 접속 확인

```bash
# SonarQube 접속
http://<EC2-IP>:32000

# 기본 로그인
# ID: admin
# PW: admin (최초 로그인 시 변경 필요)

# Pod 로그 확인
kubectl logs -f -n apc-cicd-ns -l app=sonarqube
```

### Step 5: Jenkinsfile 업데이트

```groovy
// 기존
SONAR_HOST_URL = 'http://192.168.0.170:32000'

// 변경 (EC2 내부에서)
SONAR_HOST_URL = 'http://sonarqube.apc-cicd-ns.svc.cluster.local:9000'

// 또는 (외부에서)
SONAR_HOST_URL = 'http://<EC2-IP>:32000'
```

### Step 6: 보안 그룹 설정

AWS EC2 보안 그룹에서 다음 포트 열기:
- 30080: Jenkins HTTP
- 30050: Jenkins JNLP
- 32000: SonarQube

### Step 7: 기존 systemd Jenkins 제거 (선택사항)

모든 것이 정상 작동하는지 확인 후:

```bash
# Jenkins 서비스 제거
sudo systemctl stop jenkins
sudo systemctl disable jenkins
sudo apt remove jenkins -y

# 데이터는 백업했으니 안전
```

## 확인 명령어

```bash
# 모든 Pod 확인
kubectl get pods -n apc-cicd-ns

# 모든 Service 확인
kubectl get svc -n apc-cicd-ns

# 모든 PVC 확인
kubectl get pvc -n apc-cicd-ns

# 리소스 사용량 확인
kubectl top pods -n apc-cicd-ns
```

## 문제 해결

### Pod가 시작되지 않을 때

```bash
# Pod 상태 확인
kubectl describe pod <pod-name> -n apc-cicd-ns

# 로그 확인
kubectl logs <pod-name> -n apc-cicd-ns

# 이벤트 확인
kubectl get events -n apc-cicd-ns --sort-by='.lastTimestamp'
```

### PVC 문제

```bash
# PVC 상태 확인
kubectl describe pvc <pvc-name> -n apc-cicd-ns

# k3s의 로컬 스토리지 확인
sudo ls -la /var/lib/rancher/k3s/storage/
```

### 포트 접속 안 될 때

```bash
# NodePort Service 확인
kubectl get svc -n apc-cicd-ns

# EC2 보안 그룹 확인
# AWS 콘솔에서 포트 열기 확인
```

## EKS 마이그레이션 시

나중에 EKS로 전환할 때:

1. YAML 파일 그대로 사용 가능
2. PVC는 EBS CSI Driver로 변경 필요
3. LoadBalancer 서비스로 변경 권장
4. ArgoCD Application으로 등록

## 완료 체크리스트

- [ ] k3s 설치 완료
- [ ] 네임스페이스 생성 완료
- [ ] Jenkins PVC 생성 완료
- [ ] Jenkins Pod 배포 완료
- [ ] Jenkins 접속 확인 완료
- [ ] SonarQube PVC 생성 완료
- [ ] SonarQube Pod 배포 완료
- [ ] SonarQube 접속 확인 완료
- [ ] Jenkinsfile SonarQube URL 업데이트 완료
- [ ] 보안 그룹 설정 완료
- [ ] 테스트 완료

