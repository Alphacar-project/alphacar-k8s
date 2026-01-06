#!/bin/bash
# Terraform 코드 안전 테스트 스크립트
# 실제 배포 없이 코드만 검증

set -e

echo "=========================================="
echo "Terraform 코드 안전 테스트"
echo "=========================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: 파일 구조 확인
echo "📋 Step 1: 파일 구조 확인"
echo "----------------------------------------"
TF_FILES=$(find . -name "*.tf" -type f | wc -l)
echo "Terraform 파일 수: $TF_FILES"

MODULES=$(ls -d modules/*/ 2>/dev/null | wc -l)
echo "모듈 수: $MODULES"
echo ""

# Step 2: Terraform 초기화
echo "📋 Step 2: Terraform 초기화"
echo "----------------------------------------"
if terraform init -upgrade > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 초기화 성공${NC}"
else
    echo -e "${RED}❌ 초기화 실패${NC}"
    terraform init
    exit 1
fi
echo ""

# Step 3: 문법 검증
echo "📋 Step 3: 문법 검증"
echo "----------------------------------------"
if terraform validate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 문법 검증 성공${NC}"
    terraform validate
else
    echo -e "${RED}❌ 문법 검증 실패${NC}"
    terraform validate
    exit 1
fi
echo ""

# Step 4: 코드 포맷팅 확인
echo "📋 Step 4: 코드 포맷팅 확인"
echo "----------------------------------------"
if terraform fmt -check -recursive > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 포맷팅 확인 완료 (변경사항 없음)${NC}"
else
    echo -e "${YELLOW}⚠️  포맷팅 변경사항 있음${NC}"
    echo "변경이 필요한 파일:"
    terraform fmt -check -recursive
    echo ""
    echo "자동 수정하려면: terraform fmt -recursive"
fi
echo ""

# Step 5: 모듈 의존성 확인
echo "📋 Step 5: 모듈 의존성 확인"
echo "----------------------------------------"
if grep -q "module \"network\"" main.tf && \
   grep -q "module \"security\"" main.tf && \
   grep -q "module \"eks\"" main.tf && \
   grep -q "module \"kubernetes\"" main.tf; then
    echo -e "${GREEN}✅ 주요 모듈이 main.tf에 포함되어 있음${NC}"
else
    echo -e "${YELLOW}⚠️  일부 모듈이 누락되었을 수 있음${NC}"
fi
echo ""

# Step 6: 변수 확인
echo "📋 Step 6: 변수 확인"
echo "----------------------------------------"
if [ -f "variables.tf" ]; then
    VAR_COUNT=$(grep -c "^variable" variables.tf || echo "0")
    echo "정의된 변수 수: $VAR_COUNT"
    echo -e "${GREEN}✅ variables.tf 파일 존재${NC}"
else
    echo -e "${RED}❌ variables.tf 파일 없음${NC}"
fi
echo ""

# Step 7: Provider 확인
echo "📋 Step 7: Provider 확인"
echo "----------------------------------------"
if [ -f "versions.tf" ]; then
    if grep -q "hashicorp/aws" versions.tf && \
       grep -q "hashicorp/kubernetes" versions.tf && \
       grep -q "hashicorp/helm" versions.tf; then
        echo -e "${GREEN}✅ 필수 Provider가 정의되어 있음${NC}"
        echo "  - AWS Provider"
        echo "  - Kubernetes Provider"
        echo "  - Helm Provider"
    else
        echo -e "${YELLOW}⚠️  일부 Provider가 누락되었을 수 있음${NC}"
    fi
else
    echo -e "${RED}❌ versions.tf 파일 없음${NC}"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}✅ 안전한 테스트 완료!${NC}"
echo "=========================================="
echo ""
echo "⚠️  주의사항:"
echo "   - terraform plan은 실행하지 않았습니다 (AWS API 호출)"
echo "   - terraform apply는 절대 실행하지 마세요!"
echo ""
echo "📝 다음 단계:"
echo "   1. 코드 리뷰"
echo "   2. 변수 값 확인 (terraform.tfvars.example)"
echo "   3. 별도 테스트 환경에서 terraform plan 실행 (선택사항)"
