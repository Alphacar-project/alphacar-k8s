#!/bin/bash

# S3 버킷의 CloudWatch 메트릭 및 로깅 비활성화 스크립트

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# AWS 계정 ID
ACCOUNT_ID="${ACCOUNT_ID:-382045063773}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

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

log_info "=========================================="
log_info "S3 CloudWatch 비활성화"
log_info "=========================================="
echo ""

# AWS CLI 확인
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI가 설치되어 있지 않습니다."
    exit 1
fi

# AWS 자격증명 로드
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    log_info "AWS 자격증명을 Secret에서 가져오는 중..."
    if [ -f "./load-aws-credentials.sh" ]; then
        source ./load-aws-credentials.sh
    else
        log_warning "load-aws-credentials.sh 파일을 찾을 수 없습니다."
    fi
fi

# AWS 자격증명 확인
if ! aws sts get-caller-identity &>/dev/null; then
    log_error "AWS 자격증명이 설정되지 않았습니다."
    exit 1
fi

log_info "AWS 계정 ID: $ACCOUNT_ID"
log_info "리전: $REGION"
echo ""

# S3 버킷 목록
BUCKETS=(
    "mongodb-${ACCOUNT_ID}"
    "yaml-${ACCOUNT_ID}"
    "carimage-${ACCOUNT_ID}"
)

# CloudWatch Logs 그룹 삭제
log_info "Step 1: CloudWatch Logs 그룹 확인 및 삭제 중..."
LOG_GROUPS=$(aws logs describe-log-groups --log-group-name-prefix "/aws/s3" --query 'logGroups[*].logGroupName' --output text 2>/dev/null || echo "")

if [ -n "$LOG_GROUPS" ]; then
    for log_group in $LOG_GROUPS; do
        log_info "CloudWatch Logs 그룹 삭제: $log_group"
        if aws logs delete-log-group --log-group-name "$log_group" 2>/dev/null; then
            log_success "삭제 완료: $log_group"
        else
            log_warning "삭제 실패: $log_group (이미 삭제되었을 수 있음)"
        fi
    done
else
    log_info "CloudWatch Logs 그룹이 없습니다."
fi

echo ""

# S3 버킷의 CloudWatch 메트릭 설정 확인 및 비활성화
log_info "Step 2: S3 버킷의 CloudWatch 메트릭 확인 중..."

for BUCKET_NAME in "${BUCKETS[@]}"; do
    log_info "처리 중: $BUCKET_NAME"
    
    # 버킷 존재 확인
    if ! aws s3 ls "s3://$BUCKET_NAME" &>/dev/null; then
        log_warning "버킷이 존재하지 않습니다: $BUCKET_NAME"
        continue
    fi
    
    # 버킷의 메트릭 필터 확인 (S3는 기본적으로 메트릭을 생성하지만 비활성화할 수 없음)
    # 대신 CloudWatch 대시보드나 알람을 삭제할 수 있음
    log_info "  버킷 확인 완료: $BUCKET_NAME"
done

echo ""

# CloudWatch 알람 삭제 (S3 관련)
log_info "Step 3: S3 관련 CloudWatch 알람 확인 및 삭제 중..."
ALARMS=$(aws cloudwatch describe-alarms --alarm-name-prefix "S3" --query 'MetricAlarms[*].AlarmName' --output text 2>/dev/null || echo "")

if [ -n "$ALARMS" ]; then
    for alarm in $ALARMS; do
        log_info "CloudWatch 알람 삭제: $alarm"
        if aws cloudwatch delete-alarms --alarm-names "$alarm" 2>/dev/null; then
            log_success "삭제 완료: $alarm"
        else
            log_warning "삭제 실패: $alarm"
        fi
    done
else
    log_info "S3 관련 CloudWatch 알람이 없습니다."
fi

echo ""

# CloudWatch 대시보드 삭제 (S3 관련)
log_info "Step 4: S3 관련 CloudWatch 대시보드 확인 중..."
DASHBOARDS=$(aws cloudwatch list-dashboards --query 'DashboardEntries[?contains(DashboardName, `S3`)].DashboardName' --output text 2>/dev/null || echo "")

if [ -n "$DASHBOARDS" ]; then
    for dashboard in $DASHBOARDS; do
        log_info "CloudWatch 대시보드 삭제: $dashboard"
        if aws cloudwatch delete-dashboards --dashboard-names "$dashboard" 2>/dev/null; then
            log_success "삭제 완료: $dashboard"
        else
            log_warning "삭제 실패: $dashboard"
        fi
    done
else
    log_info "S3 관련 CloudWatch 대시보드가 없습니다."
fi

echo ""

log_info "=========================================="
log_success "CloudWatch 비활성화 완료!"
log_info "=========================================="
echo ""

log_info "참고:"
log_info "  - S3 버킷의 기본 메트릭은 자동으로 생성되지만 비용이 발생하지 않습니다."
log_info "  - CloudWatch Logs, 알람, 대시보드를 삭제하여 요금을 절감했습니다."
log_info "  - 향후 CloudWatch 사용을 원하지 않으면 추가 설정을 하지 마세요."
echo ""




