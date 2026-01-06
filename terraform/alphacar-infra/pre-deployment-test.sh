#!/bin/bash
# 배포 전 전체 테스트 스크립트

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🚀 배포 전 전체 테스트"
echo "=========================================="
echo ""

PASSED=0
FAILED=0

# 테스트 함수
test_check() {
    local test_name="$1"
    local command="$2"
    
    echo -e "${BLUE}📋 $test_name${NC}"
    echo "----------------------------------------"
    
    if eval "$command" > /tmp/test_output.log 2>&1; then
        echo -e "${GREEN}✅ 통과${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ 실패${NC}"
        cat /tmp/test_output.log
        ((FAILED++))
        return 1
    fi
    echo ""
}

# 1. 파일 구조 확인
echo -e "${BLUE}📋 Step 1: 파일 구조 확인${NC}"
echo "----------------------------------------"
TF_FILES=$(find . -name "*.tf" -type f | wc -l)
MODULES=$(ls -d modules/*/ 2>/dev/null | wc -l)
echo "Terraform 파일 수: $TF_FILES"
echo "모듈 수: $MODULES"
echo -e "${GREEN}✅ 파일 구조 확인 완료${NC}"
((PASSED++))
echo ""

# 2. 필수 파일 확인
echo -e "${BLUE}📋 Step 2: 필수 파일 확인${NC}"
echo "----------------------------------------"
MISSING_FILES=0
for file in main.tf variables.tf outputs.tf versions.tf; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ $file 없음${NC}"
        ((MISSING_FILES++))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 필수 파일 존재${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ 필수 파일 누락${NC}"
    ((FAILED++))
fi
echo ""

# 3. Terraform 초기화
test_check "Step 3: Terraform 초기화" "terraform init -upgrade"

# 4. 문법 검증
test_check "Step 4: 문법 검증" "terraform validate"

# 5. 코드 포맷팅 확인
echo -e "${BLUE}📋 Step 5: 코드 포맷팅 확인${NC}"
echo "----------------------------------------"
if terraform fmt -check -recursive > /tmp/fmt_output.log 2>&1; then
    echo -e "${GREEN}✅ 포맷팅 확인 완료 (변경사항 없음)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  포맷팅 변경사항 있음${NC}"
    cat /tmp/fmt_output.log
    echo ""
    echo "자동 수정하려면: terraform fmt -recursive"
    # 포맷팅은 경고일 뿐이므로 실패로 카운트하지 않음
fi
echo ""

# 6. 변수 확인
echo -e "${BLUE}📋 Step 6: 변수 확인${NC}"
echo "----------------------------------------"
if [ -f "variables.tf" ]; then
    VAR_COUNT=$(grep -c "^variable" variables.tf || echo "0")
    echo "정의된 변수 수: $VAR_COUNT"
    
    # 필수 변수 확인
    REQUIRED_VARS=("domain_name" "bastion_ami_id" "jenkins_ami_id" "key_pair_name")
    MISSING_VARS=0
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "variable \"$var\"" variables.tf; then
            echo -e "${YELLOW}⚠️  변수 '$var' 없음 (기본값이 있을 수 있음)${NC}"
        fi
    done
    
    echo -e "${GREEN}✅ 변수 확인 완료${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ variables.tf 파일 없음${NC}"
    ((FAILED++))
fi
echo ""

# 7. Provider 확인
echo -e "${BLUE}📋 Step 7: Provider 확인${NC}"
echo "----------------------------------------"
if [ -f "versions.tf" ]; then
    PROVIDERS=("hashicorp/aws" "hashicorp/kubernetes" "hashicorp/helm" "hashicorp/tls")
    MISSING_PROVIDERS=0
    for provider in "${PROVIDERS[@]}"; do
        if ! grep -q "$provider" versions.tf; then
            echo -e "${YELLOW}⚠️  Provider '$provider' 없음${NC}"
            ((MISSING_PROVIDERS++))
        fi
    done
    
    if [ $MISSING_PROVIDERS -eq 0 ]; then
        echo -e "${GREEN}✅ 모든 필수 Provider 정의됨${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 일부 Provider 누락${NC}"
        ((FAILED++))
    fi
else
    echo -e "${RED}❌ versions.tf 파일 없음${NC}"
    ((FAILED++))
fi
echo ""

# 8. 모듈 의존성 확인
echo -e "${BLUE}📋 Step 8: 모듈 의존성 확인${NC}"
echo "----------------------------------------"
REQUIRED_MODULES=("network" "security" "eks" "compute" "ecr" "certificates" "dns" "kubernetes")
MISSING_MODULES=0
for module in "${REQUIRED_MODULES[@]}"; do
    if ! grep -q "module \"$module\"" main.tf; then
        echo -e "${YELLOW}⚠️  모듈 '$module'이 main.tf에 없음${NC}"
        ((MISSING_MODULES++))
    fi
done

if [ $MISSING_MODULES -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 주요 모듈이 main.tf에 포함됨${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ 일부 모듈 누락${NC}"
    ((FAILED++))
fi
echo ""

# 9. terraform.tfvars 확인
echo -e "${BLUE}📋 Step 9: 설정 파일 확인${NC}"
echo "----------------------------------------"
if [ -f "terraform.tfvars.example" ]; then
    echo -e "${GREEN}✅ terraform.tfvars.example 존재${NC}"
    if [ ! -f "terraform.tfvars" ]; then
        echo -e "${YELLOW}⚠️  terraform.tfvars 파일이 없습니다${NC}"
        echo "   배포 전에 terraform.tfvars 파일을 생성하세요:"
        echo "   cp terraform.tfvars.example terraform.tfvars"
    else
        echo -e "${GREEN}✅ terraform.tfvars 파일 존재${NC}"
        # 도메인 설정 확인
        if grep -q "domain_name" terraform.tfvars; then
            DOMAIN=$(grep "domain_name" terraform.tfvars | head -1 | sed 's/.*= *"\(.*\)".*/\1/')
            echo "   설정된 도메인: $DOMAIN"
        fi
    fi
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  terraform.tfvars.example 없음${NC}"
fi
echo ""

# 10. AWS 자격증명 확인
echo -e "${BLUE}📋 Step 10: AWS 자격증명 확인${NC}"
echo "----------------------------------------"
if aws sts get-caller-identity > /tmp/aws_identity.log 2>&1; then
    echo -e "${GREEN}✅ AWS 자격증명 확인됨${NC}"
    echo "계정 정보:"
    cat /tmp/aws_identity.log | grep -E "Account|UserId" | head -2
    ((PASSED++))
else
    echo -e "${RED}❌ AWS 자격증명 확인 실패${NC}"
    echo "AWS CLI 설정을 확인하세요"
    ((FAILED++))
fi
echo ""

# 11. Terraform Plan (실제 배포 전 확인)
echo -e "${BLUE}📋 Step 11: Terraform Plan (실제 배포 계획 확인)${NC}"
echo "----------------------------------------"
echo -e "${YELLOW}⚠️  이 단계는 AWS API를 호출합니다${NC}"
echo "계속하시겠습니까? (y/N)"
read -t 10 -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if terraform plan -out=tfplan > /tmp/terraform_plan.log 2>&1; then
        echo -e "${GREEN}✅ Terraform Plan 성공${NC}"
        echo ""
        echo "생성될 리소스 요약:"
        grep -E "will be created|Plan:" /tmp/terraform_plan.log | head -10
        echo ""
        echo "전체 계획은 /tmp/terraform_plan.log 파일을 확인하세요"
        ((PASSED++))
    else
        echo -e "${RED}❌ Terraform Plan 실패${NC}"
        echo "오류 내용:"
        tail -30 /tmp/terraform_plan.log
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⏭️  Terraform Plan 건너뜀${NC}"
    echo "   (수동으로 실행: terraform plan)"
fi
echo ""

# 최종 결과
echo "=========================================="
echo "📊 테스트 결과"
echo "=========================================="
echo -e "${GREEN}✅ 통과: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ 실패: $FAILED${NC}"
    echo ""
    echo "실패한 테스트를 수정한 후 다시 실행하세요."
    exit 1
else
    echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
    echo ""
    echo "다음 단계:"
    echo "1. terraform.tfvars 파일 확인 (도메인, AMI ID 등)"
    echo "2. terraform plan으로 최종 확인 (이미 실행했다면 생략)"
    echo "3. terraform apply로 배포"
fi
echo ""

# 정리
rm -f /tmp/test_output.log /tmp/fmt_output.log /tmp/aws_identity.log /tmp/terraform_plan.log 2>/dev/null
