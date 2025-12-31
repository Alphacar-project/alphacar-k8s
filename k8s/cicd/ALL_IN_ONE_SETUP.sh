#!/bin/bash

# EC2 SSH 연결 후 한 번에 실행하는 전체 설정 스크립트

set -e

echo "=========================================="
echo "Jenkins & SonarQube Pod 설치 스크립트"
echo "=========================================="
echo ""

# 1. 현재 상태 확인
echo "1. 현재 상태 확인..."
echo "메모리:"
free -h
echo ""
echo "디스크:"
df -h
echo ""

# 2. k3s 설치 (간단한 방법)
echo "2. k3s 설치 중..."
if ! command -v k3s &> /dev/null; then
    curl -sfL https://get.k3s.io | sh -
    echo "k3s 설치 완료"
else
    echo "k3s가 이미 설치되어 있습니다"
fi
echo ""

# 3. kubectl 설정
echo "3. kubectl 설정..."
mkdir -p ~/.kube
if [ -f /etc/rancher/k3s/k3s.yaml ]; then
    sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
    sudo chown $USER:$USER ~/.kube/config
    echo "kubectl 설정 완료"
else
    echo "k3s 설정 파일을 찾을 수 없습니다"
    exit 1
fi
echo ""

# 4. 네임스페이스 생성
echo "4. 네임스페이스 생성..."
kubectl create namespace apc-cicd-ns --dry-run=client -o yaml | kubectl apply -f -
echo ""

# 5. Jenkins PVC 생성
echo "5. Jenkins PVC 생성..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: jenkins-pvc
  namespace: apc-cicd-ns
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
EOF
echo ""

# 6. Jenkins Deployment & Service 배포
echo "6. Jenkins Pod 배포..."
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jenkins
  namespace: apc-cicd-ns
  labels:
    app: jenkins
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jenkins
  template:
    metadata:
      labels:
        app: jenkins
    spec:
      containers:
      - name: jenkins
        image: jenkins/jenkins:lts
        ports:
        - containerPort: 8080
          name: http-port
        - containerPort: 50000
          name: jnlp-port
        volumeMounts:
        - name: jenkins-data
          mountPath: /var/jenkins_home
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
      volumes:
      - name: jenkins-data
        persistentVolumeClaim:
          claimName: jenkins-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: jenkins
  namespace: apc-cicd-ns
  labels:
    app: jenkins
spec:
  type: NodePort
  ports:
  - port: 8080
    targetPort: 8080
    nodePort: 30080
    name: http
  - port: 50000
    targetPort: 50000
    nodePort: 30050
    name: jnlp
  selector:
    app: jenkins
EOF
echo ""

# 7. SonarQube PVC 생성
echo "7. SonarQube PVC 생성..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: sonarqube-data-pvc
  namespace: apc-cicd-ns
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: sonarqube-extensions-pvc
  namespace: apc-cicd-ns
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
EOF
echo ""

# 8. SonarQube Deployment & Service 배포
echo "8. SonarQube Pod 배포..."
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sonarqube
  namespace: apc-cicd-ns
  labels:
    app: sonarqube
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sonarqube
  template:
    metadata:
      labels:
        app: sonarqube
    spec:
      containers:
      - name: sonarqube
        image: sonarqube:lts-community
        ports:
        - containerPort: 9000
          name: http-port
        env:
        - name: SONAR_ES_BOOTSTRAP_CHECKS_DISABLE
          value: "true"
        - name: SONAR_WEB_JAVAOPTS
          value: "-Xmx768m -Xms768m"
        - name: SONAR_CE_JAVAOPTS
          value: "-Xmx512m -Xms512m"
        - name: SONAR_ES_JAVAOPTS
          value: "-Xmx512m -Xms512m"
        volumeMounts:
        - name: sonarqube-data
          mountPath: /opt/sonarqube/data
        - name: sonarqube-extensions
          mountPath: /opt/sonarqube/extensions
        resources:
          requests:
            memory: "1.5Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
      volumes:
      - name: sonarqube-data
        persistentVolumeClaim:
          claimName: sonarqube-data-pvc
      - name: sonarqube-extensions
        persistentVolumeClaim:
          claimName: sonarqube-extensions-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: sonarqube
  namespace: apc-cicd-ns
  labels:
    app: sonarqube
spec:
  type: NodePort
  ports:
  - port: 9000
    targetPort: 9000
    nodePort: 32000
    name: http
  selector:
    app: sonarqube
EOF
echo ""

# 9. 상태 확인
echo "9. 배포 상태 확인..."
echo "Pod 상태:"
kubectl get pods -n apc-cicd-ns
echo ""
echo "Service 상태:"
kubectl get svc -n apc-cicd-ns
echo ""
echo "PVC 상태:"
kubectl get pvc -n apc-cicd-ns
echo ""

echo "=========================================="
echo "설치 완료!"
echo "=========================================="
echo ""
echo "접속 주소:"
echo "  Jenkins: http://43.201.105.210:30080"
echo "  SonarQube: http://43.201.105.210:32000"
echo ""
echo "Pod 상태 확인:"
echo "  kubectl get pods -n apc-cicd-ns -w"
echo ""
echo "로그 확인:"
echo "  kubectl logs -f -n apc-cicd-ns -l app=jenkins"
echo "  kubectl logs -f -n apc-cicd-ns -l app=sonarqube"
echo ""

