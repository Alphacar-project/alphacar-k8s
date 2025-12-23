#!/bin/bash
# S3 버킷 정리 스크립트
# 유지할 버킷: mongodb-{ACCOUNT_ID}, yaml-{ACCOUNT_ID}, carimage-{ACCOUNT_ID}
# 삭제할 버킷: velero-backups-{ACCOUNT_ID} 및 기타 불필요한 버킷

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
echo "[INFO] S3 버킷 정리"
echo "[INFO] =========================================="
echo "[INFO] AWS 계정: $ACCOUNT_ID"
echo ""

# 유지할 버킷 목록
KEEP_BUCKETS=(
    "mongodb-${ACCOUNT_ID}"
    "yaml-${ACCOUNT_ID}"
    "carimage-${ACCOUNT_ID}"
    "kdh-sample-5018"
    "kimdohun.cloud"
)

echo "[INFO] 유지할 버킷:"
for bucket in "${KEEP_BUCKETS[@]}"; do
    echo "  - $bucket"
done
echo ""

# 모든 버킷 목록 가져오기
echo "[INFO] 현재 S3 버킷 목록 확인 중..."
ALL_BUCKETS=$(aws s3 ls 2>/dev/null | awk '{print $3}' | sort)

if [ -z "$ALL_BUCKETS" ]; then
    echo "[WARNING] 버킷을 찾을 수 없습니다."
    exit 0
fi

# 삭제할 버킷 찾기
BUCKETS_TO_DELETE=()
while IFS= read -r bucket; do
    if [ -z "$bucket" ]; then
        continue
    fi
    
    # 유지할 버킷인지 확인
    KEEP=false
    for keep_bucket in "${KEEP_BUCKETS[@]}"; do
        if [ "$bucket" == "$keep_bucket" ]; then
            KEEP=true
            break
        fi
    done
    
    if [ "$KEEP" = false ]; then
        BUCKETS_TO_DELETE+=("$bucket")
    fi
done <<< "$ALL_BUCKETS"

if [ ${#BUCKETS_TO_DELETE[@]} -eq 0 ]; then
    echo "[INFO] 삭제할 버킷이 없습니다."
    exit 0
fi

echo "[INFO] 삭제할 버킷:"
for bucket in "${BUCKETS_TO_DELETE[@]}"; do
    echo "  - $bucket"
done
echo ""

# 확인
read -p "위 버킷들을 삭제하시겠습니까? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "[INFO] 취소되었습니다."
    exit 0
fi

# 버킷 삭제
for bucket in "${BUCKETS_TO_DELETE[@]}"; do
    echo "[INFO] 버킷 삭제 중: $bucket"
    
    # 버킷 내 모든 객체 삭제
    echo "  - 버킷 내 객체 삭제 중..."
    aws s3 rm "s3://${bucket}/" --recursive 2>/dev/null || true
    
    # 버킷 삭제
    echo "  - 버킷 삭제 중..."
    if aws s3api delete-bucket --bucket "$bucket" --region us-east-1 2>/dev/null; then
        echo "  ✅ 버킷 삭제 완료: $bucket"
    else
        echo "  ⚠️  버킷 삭제 실패 또는 이미 삭제됨: $bucket"
    fi
    echo ""
done

echo "[SUCCESS] 버킷 정리 완료!"
echo ""
echo "[INFO] 유지된 버킷:"
for bucket in "${KEEP_BUCKETS[@]}"; do
    if aws s3api head-bucket --bucket "$bucket" 2>/dev/null; then
        echo "  ✅ $bucket"
    else
        echo "  ❌ $bucket (존재하지 않음)"
    fi
done

