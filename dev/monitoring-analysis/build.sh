#!/bin/bash

# 모니터링 분석 시스템 이미지 빌드 스크립트

set -e

ECR_REGISTRY="382045063773.dkr.ecr.ap-northeast-2.amazonaws.com"
AWS_REGION="ap-northeast-2"
FRONTEND_IMAGE="${ECR_REGISTRY}/alphacar/alphacar-monitoring-analysis-frontend"
BACKEND_IMAGE="${ECR_REGISTRY}/alphacar/alphacar-monitoring-analysis-backend"
VERSION="${1:-3.0.0}"

echo "🚀 모니터링 분석 시스템 이미지 빌드 시작..."
echo "📦 버전: ${VERSION}"
echo ""

# 프론트엔드 빌드
echo "📦 프론트엔드 이미지 빌드 중..."
cd "$(dirname "$0")/frontend"
docker build -t "${FRONTEND_IMAGE}:${VERSION}" .
echo "✅ 프론트엔드 이미지 빌드 완료: ${FRONTEND_IMAGE}:${VERSION}"
echo ""

# 백엔드 빌드
echo "📦 백엔드 이미지 빌드 중..."
cd "../backend"
docker build -t "${BACKEND_IMAGE}:${VERSION}" .
echo "✅ 백엔드 이미지 빌드 완료: ${BACKEND_IMAGE}:${VERSION}"
echo ""

echo "🎉 모든 이미지 빌드 완료!"
echo ""
echo "📤 ECR 로그인 및 이미지 푸시..."
# ECR 로그인
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# 이미지 푸시 (3.0.0 태그만)
docker push ${FRONTEND_IMAGE}:${VERSION}
docker push ${BACKEND_IMAGE}:${VERSION}

echo "✅ 모든 이미지 푸시 완료!"
echo ""
echo "📝 배포 업데이트:"
echo "  kubectl set image deployment/monitoring-analysis-frontend frontend=${FRONTEND_IMAGE}:${VERSION} -n apc-obsv-ns"
echo "  kubectl set image deployment/monitoring-analysis-backend backend=${BACKEND_IMAGE}:${VERSION} -n apc-obsv-ns"

