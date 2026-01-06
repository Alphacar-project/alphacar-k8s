#!/bin/bash
# Terraform 문법 검증만 수행 (가장 안전)

echo "Terraform 문법 검증 중..."

# 초기화
echo "1. 초기화..."
terraform init -upgrade > /dev/null 2>&1

# 검증
echo "2. 문법 검증..."
terraform validate

echo ""
echo "✅ 검증 완료 (AWS API 호출 없음)"
