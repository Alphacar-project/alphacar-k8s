#!/bin/bash

# 멀티마스터 클러스터용 시크릿 생성 스크립트
# 사용법: ./create-secrets-multimaster.sh

set -e

NAMESPACE="alphacar"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================="
echo "멀티마스터 클러스터 시크릿 생성"
echo "=========================================="
echo ""

# 네임스페이스 확인
echo "📦 네임스페이스 확인: $NAMESPACE"
kubectl get namespace $NAMESPACE || {
  echo "❌ 네임스페이스가 없습니다. 먼저 네임스페이스를 생성하세요."
  echo "   kubectl apply -f $K8S_DIR/namespace/namespace.yaml"
  exit 1
}

echo ""
echo "⚠️  중요: SECRETS_FOR_MULTIMASTER.md 문서의 값을 사용하여 시크릿을 생성합니다."
echo ""

# 1. AWS Bedrock Secret
echo "1️⃣  AWS Bedrock Secret 생성 중..."
if [ -f "$K8S_DIR/configmap-secret/secret-aws-bedrock.yaml" ]; then
  kubectl apply -f "$K8S_DIR/configmap-secret/secret-aws-bedrock.yaml"
  echo "✅ AWS Bedrock Secret 생성 완료"
else
  echo "❌ 파일이 없습니다: $K8S_DIR/configmap-secret/secret-aws-bedrock.yaml"
  echo "   템플릿을 복사하고 SECRETS_FOR_MULTIMASTER.md의 값으로 수정하세요."
  exit 1
fi

# 2. Database Secrets
echo ""
echo "2️⃣  Database Secrets 생성 중..."
if [ -f "$K8S_DIR/configmap-secret/secret-db.yaml" ]; then
  kubectl apply -f "$K8S_DIR/configmap-secret/secret-db.yaml"
  echo "✅ Database Secrets 생성 완료"
else
  echo "❌ 파일이 없습니다: $K8S_DIR/configmap-secret/secret-db.yaml"
  echo "   템플릿을 복사하고 SECRETS_FOR_MULTIMASTER.md의 값으로 수정하세요."
  exit 1
fi

# 3. Monitoring Analysis Secret
echo ""
echo "3️⃣  Monitoring Analysis Secret 생성 중..."
if [ -f "$K8S_DIR/monitoring-analysis/secret.yaml" ]; then
  kubectl apply -f "$K8S_DIR/monitoring-analysis/secret.yaml"
  echo "✅ Monitoring Analysis Secret 생성 완료"
else
  echo "❌ 파일이 없습니다: $K8S_DIR/monitoring-analysis/secret.yaml"
  echo "   템플릿을 복사하고 SECRETS_FOR_MULTIMASTER.md의 값으로 수정하세요."
  exit 1
fi

# 4. Harbor Registry Secret 확인
echo ""
echo "4️⃣  Harbor Registry Secret 확인 중..."
if kubectl get secret harbor-registry-secret -n $NAMESPACE &>/dev/null; then
  echo "✅ Harbor Registry Secret이 이미 존재합니다."
else
  echo "⚠️  Harbor Registry Secret이 없습니다."
  echo "   다음 명령어로 생성하세요:"
  echo "   kubectl create secret docker-registry harbor-registry-secret \\"
  echo "     --docker-server=192.168.0.169 \\"
  echo "     --docker-username=<your-username> \\"
  echo "     --docker-password=<your-password> \\"
  echo "     --namespace=$NAMESPACE"
fi

echo ""
echo "=========================================="
echo "시크릿 생성 완료!"
echo "=========================================="
echo ""
echo "생성된 시크릿 확인:"
kubectl get secrets -n $NAMESPACE | grep -E "aws-bedrock|mongodb|redis|mariadb|jwt|monitoring-analysis"
echo ""
echo "다음 단계:"
echo "  1. ConfigMap 수정 (멀티마스터 환경에 맞게)"
echo "  2. 배포 스크립트 실행"
echo ""

