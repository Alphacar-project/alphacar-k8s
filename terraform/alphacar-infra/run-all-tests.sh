#!/bin/bash
# 배포 전 모든 테스트 자동 실행 (비대화형)

echo "=========================================="
echo "🚀 배포 전 전체 테스트 (자동)"
echo "=========================================="
echo ""

PASSED=0
FAILED=0

# 1. 파일 구조
echo "📋 Step 1: 파일 구조 확인"
TF_FILES=$(find . -name "*.tf" -type f | wc -l)
MODULES=$(ls -d modules/*/ 2>/dev/null | wc -l)
echo "  Terraform 파일: $TF_FILES"
echo "  모듈: $MODULES"
((PASSED++))
echo ""

# 2. 필수 파일
echo "📋 Step 2: 필수 파일 확인"
for file in main.tf variables.tf outputs.tf versions.tf; do
    [ -f "$file" ] || { echo "  ❌ $file 없음"; ((FAILED++)); exit 1; }
done
echo "  ✅ 모든 필수 파일 존재"
((PASSED++))
echo ""

# 3. Terraform 초기화
echo "📋 Step 3: Terraform 초기화"
if terraform init -upgrade > /dev/null 2>&1; then
    echo "  ✅ 초기화 성공"
    ((PASSED++))
else
    echo "  ❌ 초기화 실패"
    terraform init
    ((FAILED++))
    exit 1
fi
echo ""

# 4. 문법 검증
echo "📋 Step 4: 문법 검증"
if terraform validate > /dev/null 2>&1; then
    echo "  ✅ 문법 검증 성공"
    terraform validate
    ((PASSED++))
else
    echo "  ❌ 문법 검증 실패"
    terraform validate
    ((FAILED++))
    exit 1
fi
echo ""

# 5. 포맷팅
echo "📋 Step 5: 코드 포맷팅 확인"
if terraform fmt -check -recursive > /dev/null 2>&1; then
    echo "  ✅ 포맷팅 확인 완료"
    ((PASSED++))
else
    echo "  ⚠️  포맷팅 변경사항 있음 (자동 수정 가능)"
    terraform fmt -recursive
    echo "  ✅ 포맷팅 자동 수정 완료"
    ((PASSED++))
fi
echo ""

# 6. 변수 확인
echo "📋 Step 6: 변수 확인"
VAR_COUNT=$(grep -c "^variable" variables.tf || echo "0")
echo "  정의된 변수: $VAR_COUNT"
((PASSED++))
echo ""

# 7. Provider 확인
echo "📋 Step 7: Provider 확인"
PROVIDERS=("hashicorp/aws" "hashicorp/kubernetes" "hashicorp/helm" "hashicorp/tls")
for provider in "${PROVIDERS[@]}"; do
    grep -q "$provider" versions.tf || { echo "  ❌ Provider '$provider' 없음"; ((FAILED++)); }
done
[ $FAILED -eq 0 ] && { echo "  ✅ 모든 Provider 정의됨"; ((PASSED++)); }
echo ""

# 8. 모듈 확인
echo "📋 Step 8: 모듈 의존성 확인"
REQUIRED_MODULES=("network" "security" "eks" "compute" "ecr" "certificates" "dns" "kubernetes")
for module in "${REQUIRED_MODULES[@]}"; do
    grep -q "module \"$module\"" main.tf || { echo "  ❌ 모듈 '$module' 없음"; ((FAILED++)); }
done
[ $FAILED -eq 0 ] && { echo "  ✅ 모든 모듈 포함됨"; ((PASSED++)); }
echo ""

# 9. AWS 자격증명
echo "📋 Step 9: AWS 자격증명 확인"
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "  ✅ AWS 자격증명 확인됨"
    aws sts get-caller-identity | grep -E "Account|UserId" | head -2
    ((PASSED++))
else
    echo "  ❌ AWS 자격증명 확인 실패"
    ((FAILED++))
fi
echo ""

# 10. terraform.tfvars 확인
echo "📋 Step 10: 설정 파일 확인"
if [ -f "terraform.tfvars.example" ]; then
    echo "  ✅ terraform.tfvars.example 존재"
    if [ -f "terraform.tfvars" ]; then
        echo "  ✅ terraform.tfvars 존재"
        if grep -q "domain_name" terraform.tfvars; then
            DOMAIN=$(grep "domain_name" terraform.tfvars | head -1 | sed 's/.*= *"\(.*\)".*/\1/')
            echo "  설정된 도메인: $DOMAIN"
        fi
    else
        echo "  ⚠️  terraform.tfvars 없음 (예시 파일 복사 필요)"
    fi
    ((PASSED++))
fi
echo ""

# 결과
echo "=========================================="
echo "📊 테스트 결과"
echo "=========================================="
echo "✅ 통과: $PASSED"
[ $FAILED -gt 0 ] && echo "❌ 실패: $FAILED" && exit 1
echo "✅ 모든 테스트 통과!"
echo ""
echo "다음 단계: terraform plan (선택사항)"
