#!/bin/bash

# Secret에서 AWS 자격증명을 가져와서 현재 셸의 환경 변수로 설정하는 스크립트
# 사용법: source ./load-aws-credentials.sh 또는 . ./load-aws-credentials.sh

NAMESPACE="apc-backup-ns"
SECRET_NAME="cloud-credentials"

# Secret에서 자격증명 추출
if kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &>/dev/null; then
    CREDENTIALS=$(kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o jsonpath='{.data.cloud}' | base64 -d)
    AWS_ACCESS_KEY_ID=$(echo "$CREDENTIALS" | grep -E "^aws_access_key_id" | sed 's/.*= *//' | tr -d ' ' | tr -d '\r')
    AWS_SECRET_ACCESS_KEY=$(echo "$CREDENTIALS" | grep -E "^aws_secret_access_key" | sed 's/.*= *//' | tr -d ' ' | tr -d '\r')
    
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        export AWS_ACCESS_KEY_ID
        export AWS_SECRET_ACCESS_KEY
        export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
        echo "✅ AWS 자격증명 환경 변수 설정 완료"
        echo "   AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:0:10}..."
        echo "   AWS_DEFAULT_REGION: $AWS_DEFAULT_REGION"
    else
        echo "❌ Secret에서 자격증명을 추출할 수 없습니다."
        return 1 2>/dev/null || exit 1
    fi
else
    echo "❌ Secret을 찾을 수 없습니다: $SECRET_NAME"
    return 1 2>/dev/null || exit 1
fi


