#!/bin/bash

# Kubernetes Database 배포 스크립트
# 배포 순서를 자동으로 관리하며 각 단계의 성공 여부를 확인합니다.

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 디렉터리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

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

# 배포 확인 함수
check_deployment() {
    local resource_type=$1
    local resource_name=$2
    local namespace=$3
    local timeout=${4:-60}
    
    log_info "Waiting for $resource_type/$resource_name in namespace $namespace..."
    
    if kubectl wait --for=condition=ready "$resource_type/$resource_name" -n "$namespace" --timeout="${timeout}s" 2>/dev/null; then
        log_success "$resource_type/$resource_name is ready"
        return 0
    else
        log_warning "$resource_type/$resource_name is not ready within ${timeout}s (continuing...)"
        return 1
    fi
}

# 파일 존재 확인
check_file() {
    if [ ! -f "$1" ]; then
        log_error "File not found: $1"
        return 1
    fi
    return 0
}

# 단계별 배포 함수
deploy_step() {
    local step_num=$1
    local step_name=$2
    local file=$3
    local wait_resource=${4:-""}
    local wait_namespace=${5:-""}
    
    echo ""
    log_info "=========================================="
    log_info "Step $step_num: $step_name"
    log_info "=========================================="
    
    if ! check_file "$file"; then
        log_warning "Skipping $step_name (file not found)"
        return 1
    fi
    
    log_info "Applying $file..."
    if kubectl apply -f "$file"; then
        log_success "$file applied successfully"
        
        # 리소스 대기 (지정된 경우)
        if [ -n "$wait_resource" ] && [ -n "$wait_namespace" ]; then
            local resource_type=$(echo "$wait_resource" | cut -d'/' -f1)
            local resource_name=$(echo "$wait_resource" | cut -d'/' -f2)
            check_deployment "$resource_type" "$resource_name" "$wait_namespace" 120
        fi
        
        return 0
    else
        log_error "Failed to apply $file"
        return 1
    fi
}

# 메인 배포 프로세스
main() {
    log_info "Starting Kubernetes Database deployment..."
    log_info "Working directory: $SCRIPT_DIR"
    
    # Step 1: 네임스페이스 생성
    deploy_step 1 "Create Namespaces" "namespaces.yaml"
    sleep 2
    
    # Step 2: CRD 설치
    log_info "Installing CustomResourceDefinitions..."
    
    if check_file "strimzi-crds.yaml"; then
        deploy_step 2 "Install Strimzi CRDs" "strimzi-crds.yaml"
        sleep 3
    fi
    
    if check_file "velero-crds.yaml"; then
        deploy_step 3 "Install Velero CRDs" "velero-crds.yaml"
        sleep 3
    fi
    
    # Step 3: Operator 설치
    log_info "Installing Operators..."
    
    if check_file "strimzi-operator.yaml"; then
        deploy_step 4 "Install Strimzi Operator" "strimzi-operator.yaml" \
            "deployment/strimzi-cluster-operator" "apc-striming-ns"
        sleep 5
    fi
    
    if check_file "velero-install.yaml"; then
        deploy_step 5 "Install Velero" "velero-install.yaml" \
            "deployment/velero" "apc-backup-ns"
        sleep 5
    fi
    
    # Step 4: Longhorn UI (선택사항 - Longhorn이 Helm으로 설치된 경우)
    if check_file "longhorn-ui.yaml"; then
        log_warning "Longhorn UI requires Longhorn to be installed via Helm first"
        read -p "Is Longhorn already installed? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            deploy_step 6 "Deploy Longhorn UI" "longhorn-ui.yaml" \
                "deployment/longhorn-ui" "admin"
            sleep 3
        else
            log_warning "Skipping Longhorn UI deployment"
        fi
    fi
    
    # Step 5: MongoDB StatefulSet
    if check_file "mongodb-statefulset.yaml"; then
        log_warning "MongoDB StatefulSet requires Longhorn StorageClass"
        read -p "Is Longhorn StorageClass available? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            deploy_step 7 "Deploy MongoDB StatefulSet" "mongodb-statefulset.yaml"
            log_info "Waiting for MongoDB Pods to be ready..."
            sleep 10
            for i in {0..2}; do
                check_deployment "pod" "mongodb-$i" "apc-db-ns" 180 || true
            done
        else
            log_warning "Skipping MongoDB StatefulSet deployment"
        fi
    fi
    
    # Step 6: Kafka 클러스터 (Strimzi Operator 준비 후)
    if check_file "kafka-cluster.yaml"; then
        log_info "Checking if Strimzi Operator is ready..."
        if kubectl get deployment strimzi-cluster-operator -n apc-striming-ns &>/dev/null; then
            deploy_step 8 "Deploy Kafka Cluster" "kafka-cluster.yaml"
            sleep 5
        else
            log_warning "Strimzi Operator not found. Skipping Kafka cluster deployment"
        fi
    fi
    
    if check_file "kafka-nodepool.yaml"; then
        if kubectl get kafka -n apc-striming-ns &>/dev/null 2>&1; then
            deploy_step 9 "Deploy Kafka NodePool" "kafka-nodepool.yaml"
            sleep 3
        else
            log_warning "Kafka cluster not found. Skipping Kafka NodePool deployment"
        fi
    fi
    
    # Step 7: Crawler (선택사항)
    if check_file "crawler-deployment.yaml"; then
        read -p "Deploy Crawler? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            deploy_step 10 "Deploy Crawler" "crawler-deployment.yaml"
        else
            log_warning "Skipping Crawler deployment"
        fi
    fi
    
    echo ""
    log_success "=========================================="
    log_success "Deployment completed!"
    log_success "=========================================="
    echo ""
    log_info "Checking deployment status..."
    echo ""
    
    # 배포 상태 확인
    log_info "Namespaces:"
    kubectl get namespaces | grep -E "apc-db-ns|apc-backup-ns|apc-striming-ns|admin" || true
    
    echo ""
    log_info "MongoDB Pods:"
    kubectl get pods -n apc-db-ns -l app=mongodb 2>/dev/null || log_warning "MongoDB not deployed"
    
    echo ""
    log_info "Velero:"
    kubectl get pods -n apc-backup-ns -l app=velero 2>/dev/null || log_warning "Velero not deployed"
    
    echo ""
    log_info "Strimzi Operator:"
    kubectl get pods -n apc-striming-ns -l name=strimzi-cluster-operator 2>/dev/null || log_warning "Strimzi Operator not deployed"
    
    echo ""
    log_info "Longhorn UI:"
    kubectl get pods -n admin -l app=longhorn-ui 2>/dev/null || log_warning "Longhorn UI not deployed"
    
    echo ""
    log_info "Kafka:"
    kubectl get kafka -n apc-striming-ns 2>/dev/null || log_warning "Kafka not deployed"
}

# 실행
main "$@"



