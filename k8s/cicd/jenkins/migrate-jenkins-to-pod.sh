#!/bin/bash

# Jenkins systemd → Pod 마이그레이션 스크립트

set -e

echo "=========================================="
echo "Jenkins systemd → Pod 마이그레이션"
echo "=========================================="
echo ""

JENKINS_HOME="/var/lib/jenkins"
BACKUP_DIR="$HOME/jenkins-backup-$(date +%Y%m%d-%H%M%S)"
NAMESPACE="apc-cicd-ns"

# 1. 백업
echo "1. Jenkins 데이터 백업..."
mkdir -p "$BACKUP_DIR"
sudo tar -czf "$BACKUP_DIR/jenkins-data.tar.gz" "$JENKINS_HOME" 2>/dev/null || true
sudo cp -r "$JENKINS_HOME" "$BACKUP_DIR/" 2>/dev/null || true
echo "백업 완료: $BACKUP_DIR"
echo ""

# 2. PVC 생성
echo "2. Jenkins PVC 생성..."
kubectl apply -f jenkins-pvc.yaml
kubectl get pvc -n $NAMESPACE
echo ""

# 3. 기존 Jenkins 중지 (하지만 제거하지 않음)
echo "3. 기존 Jenkins 서비스 중지..."
sudo systemctl stop jenkins
sudo systemctl disable jenkins
echo "⚠️  기존 Jenkins가 중지되었습니다 (데이터는 그대로 유지)"
echo ""

# 4. Jenkins Pod 배포
echo "4. Jenkins Pod 배포..."
kubectl apply -f jenkins-deployment-k3s.yaml
echo ""

# 5. Pod 상태 확인
echo "5. Pod 상태 확인..."
sleep 10
kubectl get pods -n $NAMESPACE -l app=jenkins
echo ""

# 6. 데이터 마이그레이션 (Pod가 실행된 후)
echo "6. 데이터 마이그레이션 준비..."
echo "⚠️  Pod가 Running 상태가 되면 다음 명령어로 데이터 복사:"
echo ""
echo "# Pod 이름 확인"
echo "POD_NAME=\$(kubectl get pods -n $NAMESPACE -l app=jenkins -o jsonpath='{.items[0].metadata.name}')"
echo ""
echo "# 데이터 복사 (Pod가 Ready 상태일 때)"
echo "kubectl cp $JENKINS_HOME \$POD_NAME:/var/jenkins_home -n $NAMESPACE"
echo ""
echo "# 또는 PVC에 직접 마운트 후 복사"
echo ""

echo "=========================================="
echo "마이그레이션 절차 완료"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. Pod가 Running 상태인지 확인: kubectl get pods -n $NAMESPACE"
echo "2. Jenkins 접속: http://<EC2-IP>:30080"
echo "3. 데이터 마이그레이션 (필요시)"
echo "4. 테스트 후 기존 systemd Jenkins 제거 (선택사항)"
echo ""

