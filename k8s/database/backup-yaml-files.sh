#!/bin/bash

# Kubernetes YAML 파일 백업 스크립트
# k8s/database 디렉터리의 모든 YAML 파일을 백업하고 S3에 업로드합니다.

set -e

# 설정
BACKUP_DIR="/home/alphacar/alphacar-final/k8s/database"
NAMESPACE="apc-backup-ns"
CONFIGMAP_NAME="velero-aws-config"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# ConfigMap에서 S3 설정 읽기
if kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" &>/dev/null; then
    S3_BUCKET=$(kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" -o jsonpath='{.data.S3_BUCKET_YAML}')
    if [ -z "$S3_BUCKET" ] || [ "$S3_BUCKET" = "null" ]; then
        # 기본값 사용
        S3_BUCKET="${S3_BUCKET:-yaml-382045063773}"
    fi
else
    # 기본값 사용
    S3_BUCKET="${S3_BUCKET:-yaml-382045063773}"
fi

S3_PREFIX="yaml-files"
BACKUP_FILE="k8s-database-backup-${TIMESTAMP}.tar.gz"
TEMP_DIR=$(mktemp -d)

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 디렉터리 확인
if [ ! -d "$BACKUP_DIR" ]; then
    log_error "백업 디렉터리를 찾을 수 없습니다: $BACKUP_DIR"
    exit 1
fi

log_info "YAML 파일 백업 시작..."
log_info "백업 디렉터리: $BACKUP_DIR"
log_info "백업 파일: $BACKUP_FILE"

# 백업할 파일 목록 생성
cd "$BACKUP_DIR"

# 백업할 파일 타입
FILES_TO_BACKUP=(
    "*.yaml"
    "*.yml"
    "*.md"
    "*.sh"
    "*.html"
)

# 임시 디렉터리에 파일 복사
log_info "파일 수집 중..."
for pattern in "${FILES_TO_BACKUP[@]}"; do
    if ls $pattern 1> /dev/null 2>&1; then
        cp -v $pattern "$TEMP_DIR/" 2>/dev/null || true
    fi
done

# 파일 목록 확인
FILE_COUNT=$(find "$TEMP_DIR" -type f | wc -l)
if [ "$FILE_COUNT" -eq 0 ]; then
    log_error "백업할 파일이 없습니다."
    rm -rf "$TEMP_DIR"
    exit 1
fi

log_info "백업할 파일 수: $FILE_COUNT"

# 압축 파일 생성
log_info "압축 파일 생성 중..."
cd "$TEMP_DIR"
tar -czf "$BACKUP_FILE" ./*

# 원본 위치로 이동
mv "$BACKUP_FILE" "$BACKUP_DIR/"

# 파일 크기 확인
FILE_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
log_info "백업 파일 크기: $FILE_SIZE"

# S3 업로드 (AWS CLI가 설치되어 있는 경우)
if command -v aws &> /dev/null; then
    log_info "S3에 업로드 중..."
    if aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://${S3_BUCKET}/${S3_PREFIX}/" 2>/dev/null; then
        log_success "S3 업로드 완료: s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}"
        
        # 로컬 파일 삭제 여부 확인
        read -p "로컬 백업 파일을 삭제하시겠습니까? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -f "$BACKUP_DIR/$BACKUP_FILE"
            log_info "로컬 백업 파일 삭제됨"
        else
            log_info "로컬 백업 파일 유지: $BACKUP_DIR/$BACKUP_FILE"
        fi
    else
        log_warning "S3 업로드 실패. 로컬 백업 파일은 유지됩니다: $BACKUP_DIR/$BACKUP_FILE"
        log_warning "AWS CLI 설정을 확인하세요."
    fi
else
    log_warning "AWS CLI가 설치되어 있지 않습니다. S3 업로드를 건너뜁니다."
    log_info "로컬 백업 파일: $BACKUP_DIR/$BACKUP_FILE"
    log_info "수동으로 S3에 업로드하려면:"
    log_info "  aws s3 cp $BACKUP_DIR/$BACKUP_FILE s3://${S3_BUCKET}/${S3_PREFIX}/"
fi

# 임시 디렉터리 정리
rm -rf "$TEMP_DIR"

log_success "백업 완료!"
log_info "백업 파일: $BACKUP_DIR/$BACKUP_FILE"
log_info "S3 위치: s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}"

