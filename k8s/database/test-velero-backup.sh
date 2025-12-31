#!/bin/bash

# Velero 백업 테스트 스크립트

set -e

NAMESPACE="apc-backup-ns"
BACKUP_NAME="mongodb-manual-backup-$(date +%Y%m%d-%H%M%S)"

echo "=========================================="
echo "Velero MongoDB 수동 백업 테스트"
echo "=========================================="
echo ""

# 1. 백업 생성
echo "📦 백업 생성 중: $BACKUP_NAME"
cat <<EOF | kubectl apply -f -
apiVersion: velero.io/v1
kind: Backup
metadata:
  name: $BACKUP_NAME
  namespace: $NAMESPACE
spec:
  includedNamespaces:
  - apc-db-ns
  includedResources:
  - "*"
  excludedResources:
  - events
  - events.events.k8s.io
  storageLocation: default
  snapshotVolumes: true
  includeClusterResources: false
  labelSelector:
    matchLabels:
      app: mongodb
  ttl: 720h0m0s
EOF

echo ""
echo "✅ 백업 요청 생성 완료"
echo ""

# 2. 백업 상태 확인
echo "⏳ 백업 진행 상황 확인 중..."
echo ""

for i in {1..30}; do
    STATUS=$(kubectl get backup $BACKUP_NAME -n $NAMESPACE -o jsonpath='{.status.phase}' 2>/dev/null || echo "Pending")
    
    if [ "$STATUS" = "Completed" ]; then
        echo "✅ 백업 완료!"
        break
    elif [ "$STATUS" = "Failed" ]; then
        echo "❌ 백업 실패!"
        kubectl describe backup $BACKUP_NAME -n $NAMESPACE
        exit 1
    else
        echo "   상태: $STATUS (${i}/30)"
        sleep 2
    fi
done

echo ""
echo "📊 백업 상세 정보:"
kubectl get backup $BACKUP_NAME -n $NAMESPACE -o yaml | grep -A 20 "status:"

echo ""
echo "💾 백업 파일 위치:"
echo "   S3 버킷: mongodb-382045063773"
echo "   경로: backups/backups/$BACKUP_NAME/"
echo ""
echo "백업 이름: $BACKUP_NAME"
echo ""
echo "백업 복원 테스트를 하려면:"
echo "  kubectl create backup restore mongodb-restore-test --from-backup $BACKUP_NAME -n $NAMESPACE"

