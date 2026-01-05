#!/bin/bash
set -e

FUNCTION_NAME="alertmanager-webhook-handler"
REGION="ap-northeast-2"
ROLE_NAME="lambda-alertmanager-role"
ZIP_FILE="alertmanager-handler.zip"

echo "🚀 Lambda 함수 배포 시작..."

# 1. IAM 역할 생성 (없는 경우)
echo "📋 IAM 역할 확인/생성..."
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --region $REGION 2>/dev/null | jq -r '.Role.Arn' || echo "")

if [ -z "$ROLE_ARN" ]; then
    echo "IAM 역할 생성 중..."
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --region $REGION
    
    # 기본 Lambda 실행 정책 연결
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --region $REGION
    
    # EKS 클러스터 접근을 위한 정책 추가 (필요시)
    cat > /tmp/eks-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "*"
    }
  ]
}
EOF
    
    aws iam put-role-policy \
        --role-name $ROLE_NAME \
        --policy-name EKSReadAccess \
        --policy-document file:///tmp/eks-policy.json \
        --region $REGION
    
    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --region $REGION | jq -r '.Role.Arn')
    echo "✅ IAM 역할 생성 완료: $ROLE_ARN"
    
    # 역할이 활성화될 때까지 대기
    echo "⏳ IAM 역할 활성화 대기 중..."
    sleep 10
else
    echo "✅ 기존 IAM 역할 사용: $ROLE_ARN"
fi

# 2. 의존성 설치 및 패키징
echo "📦 Lambda 함수 패키징 중..."
cd "$(dirname "$0")"

# 필요한 파일들 복사
mkdir -p package
cp alertmanagerHandler.js package/
cp ../eventDrivenAutomation.js package/
cp ../remediationEngine.js package/
cp ../anomalyDetector.js package/
cp ../multiCloudCollector.js package/

# package.json 생성
cat > package/package.json <<EOF
{
  "name": "alertmanager-lambda-handler",
  "version": "1.0.0",
  "description": "AWS Lambda handler for Prometheus Alertmanager webhook",
  "main": "alertmanagerHandler.js",
  "dependencies": {
    "@aws-sdk/client-lambda": "^3.0.0"
  }
}
EOF

# Lambda 함수 디렉토리 구조 생성
mkdir -p package/aiops
cp ../*.js package/aiops/ 2>/dev/null || true

# ZIP 파일 생성
cd package
zip -r ../$ZIP_FILE . -q
cd ..

echo "✅ 패키징 완료: $ZIP_FILE"

# 3. Lambda 함수 생성 또는 업데이트
echo "🔧 Lambda 함수 배포 중..."

FUNCTION_EXISTS=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null || echo "NOT_FOUND")

if [[ "$FUNCTION_EXISTS" == *"NOT_FOUND"* ]] || [ -z "$FUNCTION_EXISTS" ]; then
    echo "새 Lambda 함수 생성 중..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler alertmanagerHandler.handler \
        --zip-file fileb://$ZIP_FILE \
        --timeout 300 \
        --memory-size 512 \
        --region $REGION \
        --environment Variables="{
            BACKEND_API_URL=http://monitoring-analysis-backend.apc-obsv-ns.svc.cluster.local:5000
        }"
    
    echo "✅ Lambda 함수 생성 완료"
else
    echo "기존 Lambda 함수 업데이트 중..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://$ZIP_FILE \
        --region $REGION
    
    echo "✅ Lambda 함수 업데이트 완료"
fi

# 4. Lambda 함수 URL 생성 (API Gateway 대신 사용)
echo "🌐 Lambda 함수 URL 생성 중..."
FUNCTION_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --region $REGION 2>/dev/null | jq -r '.FunctionUrl' || echo "")

if [ -z "$FUNCTION_URL" ]; then
    aws lambda create-function-url-config \
        --function-name $FUNCTION_NAME \
        --auth-type NONE \
        --cors '{"AllowOrigins": ["*"], "AllowMethods": ["POST", "GET"], "AllowHeaders": ["*"]}' \
        --region $REGION
    
    FUNCTION_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --region $REGION | jq -r '.FunctionUrl')
    
    # Lambda 함수에 URL invoke 권한 추가
    aws lambda add-permission \
        --function-name $FUNCTION_NAME \
        --statement-id FunctionURLAllowPublicInvoke \
        --action lambda:InvokeFunctionUrl \
        --principal "*" \
        --function-url-auth-type NONE \
        --region $REGION
    
    echo "✅ Lambda 함수 URL 생성 완료"
else
    echo "✅ 기존 Lambda 함수 URL 사용"
fi

echo ""
echo "🎉 배포 완료!"
echo "📝 Lambda 함수 URL: $FUNCTION_URL"
echo ""
echo "Alertmanager 설정에 다음 URL을 추가하세요:"
echo "  $FUNCTION_URL"
echo ""
