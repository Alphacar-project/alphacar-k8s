#!/bin/bash

# 모니터링 분석 시스템 이미지 빌드 스크립트

set -e

REGISTRY="192.168.0.170:30000/aiobsv"
FRONTEND_IMAGE="${REGISTRY}/monitoring-analysis-frontend"
BACKEND_IMAGE="${REGISTRY}/monitoring-analysis-backend"
VERSION="${1:-1.0.0}"

echo "🚀 모니터링 분석 시스템 이미지 빌드 시작..."
echo "📦 버전: ${VERSION}"
echo ""

# 프론트엔드 빌드
echo "📦 프론트엔드 이미지 빌드 중..."
cd "$(dirname "$0")/frontend"
docker build -t "${FRONTEND_IMAGE}:${VERSION}" .
docker tag "${FRONTEND_IMAGE}:${VERSION}" "${FRONTEND_IMAGE}:latest"
echo "✅ 프론트엔드 이미지 빌드 완료: ${FRONTEND_IMAGE}:${VERSION}"
echo ""

# 백엔드 빌드
echo "📦 백엔드 이미지 빌드 중..."
cd "../backend"
docker build -t "${BACKEND_IMAGE}:${VERSION}" .
docker tag "${BACKEND_IMAGE}:${VERSION}" "${BACKEND_IMAGE}:latest"
echo "✅ 백엔드 이미지 빌드 완료: ${BACKEND_IMAGE}:${VERSION}"
echo ""

echo "🎉 모든 이미지 빌드 완료!"
echo ""
echo "📤 이미지 푸시:"
echo "  docker push ${FRONTEND_IMAGE}:${VERSION}"
echo "  docker push ${FRONTEND_IMAGE}:latest"
echo "  docker push ${BACKEND_IMAGE}:${VERSION}"
echo "  docker push ${BACKEND_IMAGE}:latest"
echo ""
echo "📝 배포 업데이트:"
echo "  kubectl set image deployment/monitoring-analysis-frontend frontend=${FRONTEND_IMAGE}:${VERSION} -n apc-obsv-ns"
echo "  kubectl set image deployment/monitoring-analysis-backend backend=${BACKEND_IMAGE}:${VERSION} -n apc-obsv-ns"

