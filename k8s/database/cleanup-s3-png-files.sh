#!/bin/bash
# S3 버킷 내 PNG 파일 정리 스크립트
# 유지할 버킷에서 PNG 파일 삭제

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# AWS 자격증명 로드
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "[INFO] AWS 자격증명을 Secret에서 가져오는 중..."
    if [ -f "./load-aws-credentials.sh" ]; then
        source ./load-aws-credentials.sh
    else
        echo "[ERROR] load-aws-credentials.sh 파일을 찾을 수 없습니다."
        exit 1
    fi
fi

# AWS 계정 ID 가져오기
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
if [ -z "$ACCOUNT_ID" ]; then
    echo "[ERROR] AWS 계정 ID를 가져올 수 없습니다."
    exit 1
fi

echo "[INFO] =========================================="
echo "[INFO] S3 버킷 내 PNG 파일 정리"
echo "[INFO] =========================================="
echo "[INFO] AWS 계정: $ACCOUNT_ID"
echo ""

# 검색할 버킷 목록
SEARCH_BUCKETS=(
    "mongodb-${ACCOUNT_ID}"
    "yaml-${ACCOUNT_ID}"
    "carimage-${ACCOUNT_ID}"
)

TOTAL_PNG=0
TOTAL_DELETED=0

for bucket in "${SEARCH_BUCKETS[@]}"; do
    echo "[INFO] 버킷 확인: $bucket"
    
    # 버킷 존재 확인
    if ! aws s3api head-bucket --bucket "$bucket" 2>/dev/null; then
        echo "  ⚠️  버킷이 존재하지 않습니다: $bucket"
        echo ""
        continue
    fi
    
    # PNG 파일 찾기
    echo "  - PNG 파일 검색 중..."
    PNG_FILES=$(aws s3 ls "s3://${bucket}/" --recursive 2>/dev/null | grep -i "\.png$" | awk '{print $4}' || true)
    
    if [ -z "$PNG_FILES" ]; then
        echo "  ✅ PNG 파일 없음"
        echo ""
        continue
    fi
    
    PNG_COUNT=$(echo "$PNG_FILES" | wc -l)
    TOTAL_PNG=$((TOTAL_PNG + PNG_COUNT))
    
    echo "  - 발견된 PNG 파일: $PNG_COUNT 개"
    
    # PNG 파일 목록 표시 (처음 10개만)
    echo "$PNG_FILES" | head -10 | while read -r file; do
        echo "    - $file"
    done
    
    if [ "$PNG_COUNT" -gt 10 ]; then
        echo "    ... 외 $((PNG_COUNT - 10)) 개"
    fi
    
    # 확인
    read -p "  위 PNG 파일들을 삭제하시겠습니까? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "  ⏭️  건너뜀: $bucket"
        echo ""
        continue
    fi
    
    # PNG 파일 삭제
    DELETED=0
    echo "$PNG_FILES" | while read -r file; do
        if aws s3 rm "s3://${bucket}/${file}" 2>/dev/null; then
            DELETED=$((DELETED + 1))
            TOTAL_DELETED=$((TOTAL_DELETED + 1))
        fi
    done
    
    echo "  ✅ PNG 파일 삭제 완료: $PNG_COUNT 개"
    echo ""
done

echo "[SUCCESS] PNG 파일 정리 완료!"
echo "[INFO] 총 발견: $TOTAL_PNG 개"
echo "[INFO] 총 삭제: $TOTAL_DELETED 개"


