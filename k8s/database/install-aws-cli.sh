#!/bin/bash

# AWS CLI 설치 스크립트
# Ubuntu 24.04에서 AWS CLI v2를 설치합니다.

set -e

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

log_info "AWS CLI 설치 시작..."

# 이미 설치되어 있는지 확인
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version 2>&1)
    log_success "AWS CLI가 이미 설치되어 있습니다: $AWS_VERSION"
    exit 0
fi

# 설치 방법 선택
INSTALL_METHOD=""

# 방법 1: apt (간단하지만 구버전일 수 있음)
if command -v apt &> /dev/null; then
    log_info "방법 1: apt를 사용한 설치 (권장)"
    log_info "실행: sudo apt update && sudo apt install -y awscli"
    INSTALL_METHOD="apt"
fi

# 방법 2: snap (최신 버전)
if command -v snap &> /dev/null; then
    log_info "방법 2: snap을 사용한 설치"
    log_info "실행: sudo snap install aws-cli --classic"
    INSTALL_METHOD="snap"
fi

# 방법 3: AWS 공식 설치 (최신 버전 v2)
log_info "방법 3: AWS 공식 설치 (최신 버전 v2, 권장)"
log_info "이 방법은 최신 버전을 설치하지만 수동 설치가 필요합니다."

echo ""
log_info "설치 방법을 선택하세요:"
echo "  1) apt (간단, 빠름)"
echo "  2) snap (중간)"
echo "  3) AWS 공식 설치 (최신 버전, 수동)"
read -p "선택 (1-3): " choice

case $choice in
    1)
        log_info "apt를 사용하여 설치합니다..."
        log_warning "sudo 권한이 필요합니다."
        echo ""
        echo "다음 명령어를 실행하세요:"
        echo "  sudo apt update"
        echo "  sudo apt install -y awscli"
        echo ""
        read -p "지금 실행하시겠습니까? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo apt update
            sudo apt install -y awscli
            if [ $? -eq 0 ]; then
                log_success "AWS CLI 설치 완료"
                aws --version
            else
                log_error "설치 실패"
                exit 1
            fi
        else
            log_info "수동으로 설치하세요: sudo apt install -y awscli"
        fi
        ;;
    2)
        log_info "snap을 사용하여 설치합니다..."
        log_warning "sudo 권한이 필요합니다."
        echo ""
        echo "다음 명령어를 실행하세요:"
        echo "  sudo snap install aws-cli --classic"
        echo ""
        read -p "지금 실행하시겠습니까? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo snap install aws-cli --classic
            if [ $? -eq 0 ]; then
                log_success "AWS CLI 설치 완료"
                aws --version
            else
                log_error "설치 실패"
                exit 1
            fi
        else
            log_info "수동으로 설치하세요: sudo snap install aws-cli --classic"
        fi
        ;;
    3)
        log_info "AWS CLI v2 공식 설치 방법:"
        echo ""
        echo "1. 다운로드:"
        echo "   curl \"https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip\" -o \"awscliv2.zip\""
        echo ""
        echo "2. 압축 해제:"
        echo "   unzip awscliv2.zip"
        echo ""
        echo "3. 설치:"
        echo "   sudo ./aws/install"
        echo ""
        echo "4. 설치 확인:"
        echo "   aws --version"
        echo ""
        log_info "자동 설치를 진행하시겠습니까? (y/n): "
        read -p "" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "AWS CLI v2 다운로드 중..."
            curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
            
            if [ ! -f "/tmp/awscliv2.zip" ]; then
                log_error "다운로드 실패"
                exit 1
            fi
            
            log_info "압축 해제 중..."
            cd /tmp
            unzip -q awscliv2.zip
            
            log_info "설치 중... (sudo 권한 필요)"
            sudo ./aws/install
            
            if [ $? -eq 0 ]; then
                log_success "AWS CLI v2 설치 완료"
                aws --version
                rm -rf /tmp/awscliv2.zip /tmp/aws
            else
                log_error "설치 실패"
                exit 1
            fi
        fi
        ;;
    *)
        log_error "잘못된 선택입니다."
        exit 1
        ;;
esac

# 설치 확인
if command -v aws &> /dev/null; then
    log_success "AWS CLI 설치 확인 완료"
    echo ""
    log_info "다음 단계:"
    log_info "1. AWS 자격증명 설정:"
    log_info "   aws configure"
    log_info ""
    log_info "2. 또는 환경 변수로 설정:"
    log_info "   export AWS_ACCESS_KEY_ID=your-access-key"
    log_info "   export AWS_SECRET_ACCESS_KEY=your-secret-key"
    log_info ""
    log_info "3. 자격증명 확인:"
    log_info "   aws sts get-caller-identity"
    log_info ""
    log_info "4. S3 버킷 설정:"
    log_info "   ./setup-s3-bucket.sh"
else
    log_warning "AWS CLI가 설치되지 않았습니다. 수동으로 설치하세요."
fi



