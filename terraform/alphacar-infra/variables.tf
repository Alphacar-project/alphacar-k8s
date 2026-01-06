# Common variables
variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "alphacar"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# EC2 Variables
variable "bastion_ami_id" {
  description = "AMI ID for Bastion host (Amazon Linux 2023)"
  type        = string
  default     = "ami-0b818a04bc9c2133c" # Update with latest AMI
}

variable "jenkins_ami_id" {
  description = "AMI ID for Jenkins server (Amazon Linux 2023)"
  type        = string
  default     = "ami-0a71e3eb8b23101ed" # Update with latest AMI
}

variable "key_pair_name" {
  description = "Key pair name for EC2 instances"
  type        = string
  default     = "dz3-kdh" # Update with your key pair name
}

# ECR Variables
variable "ecr_repository_names" {
  description = "List of ECR repository names"
  type        = list(string)
  default = [
    "alphacar/frontend",
    "alphacar/alphacar-main",
    "alphacar/alphacar-search",
    "alphacar/alphacar-community",
    "alphacar/alphacar-aichat",
    "alphacar/kafka-connect-s3",
    "alphacar/alphacar-news",
    "alphacar/alphacar-monitoring-analysis-frontend",
    "alphacar/alphacar-monitoring-analysis-backend",
    "alphacar/alphacar-quote",
    "alphacar/alphacar-mypage"
  ]
}

# DNS/ALB Variables
variable "main_alb_dns_name" {
  description = "Main ALB DNS name (from Kubernetes ALB Ingress Controller)"
  type        = string
  default     = "k8s-alphacarmainalb-4c78644449-1674282483.ap-northeast-2.elb.amazonaws.com"
}

variable "main_alb_zone_id" {
  description = "Main ALB zone ID"
  type        = string
  default     = "ZWKZPGTI48KDX"
}

variable "monitor_alb_dns_name" {
  description = "Monitor ALB DNS name (from Kubernetes ALB Ingress Controller)"
  type        = string
  default     = "k8s-apcobsvn-grafanai-521ad18beb-138701628.ap-northeast-2.elb.amazonaws.com"
}

# Domain Variables
variable "domain_name" {
  description = "Domain name for Route 53 (e.g., alphacar.cloud, kimdohun.cloud)"
  type        = string
  default     = "alphacar.cloud"
}

# Kubernetes Variables
variable "kubernetes_cluster_name" {
  description = "EKS cluster name for Kubernetes provider"
  type        = string
  default     = "apc-eks-cluster"
}

variable "kubernetes_host" {
  description = "EKS cluster endpoint (will be set from EKS module output)"
  type        = string
  default     = ""
}

variable "kubernetes_cluster_ca_certificate" {
  description = "EKS cluster CA certificate (base64 encoded, will be set from EKS module output)"
  type        = string
  default     = ""
}

variable "kubernetes_namespaces" {
  description = "List of Kubernetes namespaces to create"
  type        = list(string)
  default = [
    "apc-be-ns",
    "apc-fe-ns",
    "apc-db-ns",
    "apc-obsv-ns",
    "apc-fin-ns",
    "apc-ek-ns",
    "apc-backup-ns",
    "apc-striming-ns",
    "admin",
    "load-test"
  ]
}
