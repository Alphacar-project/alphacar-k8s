# alphacar.cloud Infrastructure
# Complete Infrastructure as Code

# Data sources
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# Local values
locals {
  region     = data.aws_region.current.name
  account_id = data.aws_caller_identity.current.account_id

  common_tags = {
    ManagedBy   = "Terraform"
    Environment = "production"
    Project     = "alphacar"
  }
}

# ============================================================================
# Network Module
# ============================================================================
module "network" {
  source = "./modules/network"

  common_tags = local.common_tags
}

# ============================================================================
# Security Module
# ============================================================================
module "security" {
  source = "./modules/security"

  common_tags = local.common_tags
  eks_vpc_id  = module.network.eks_vpc_id
  cicd_vpc_id = module.network.cicd_vpc_id
}

# ============================================================================
# EKS Module
# ============================================================================
module "eks" {
  source = "./modules/eks"

  common_tags = local.common_tags
  cluster_subnet_ids = [
    module.network.eks_subnet_ids.private_app_a,
    module.network.eks_subnet_ids.private_app_b
  ]
  cluster_security_group_id = module.security.security_group_ids.eks_cluster
  node_group_subnet_ids = [
    module.network.eks_subnet_ids.private_app_a,
    module.network.eks_subnet_ids.private_app_b
  ]
  node_group_role_arn          = module.security.node_group_role_arn
  node_group_role_name         = module.security.node_group_role_name
  node_group_security_group_id = module.security.security_group_ids.eks_nodegroup
  ec2_ssh_key                  = var.key_pair_name
}

# ============================================================================
# Compute Module (EC2)
# ============================================================================
module "compute" {
  source = "./modules/compute"

  common_tags                       = local.common_tags
  bastion_ami_id                    = var.bastion_ami_id
  bastion_subnet_id                 = module.network.eks_subnet_ids.public_a
  bastion_security_group_id         = module.security.security_group_ids.ssh_access
  bastion_iam_instance_profile_name = module.security.instance_profile_names.bastion
  jenkins_ami_id                    = var.jenkins_ami_id
  jenkins_subnet_id                 = module.network.cicd_subnet_id
  jenkins_security_group_id         = module.security.security_group_ids.sonarqube
  jenkins_iam_instance_profile_name = module.security.instance_profile_names.jenkins
  key_pair_name                     = var.key_pair_name
}

# ============================================================================
# ECR Module
# ============================================================================
module "ecr" {
  source = "./modules/ecr"

  common_tags      = local.common_tags
  repository_names = var.ecr_repository_names
}

# ============================================================================
# Certificates Module
# ============================================================================
module "certificates" {
  source = "./modules/certificates"

  common_tags = local.common_tags
  domain_name = var.domain_name
}

# ============================================================================
# DNS Module (Route 53)
# ============================================================================
module "dns" {
  source = "./modules/dns"

  common_tags          = local.common_tags
  domain_name          = var.domain_name
  main_alb_dns_name    = var.main_alb_dns_name
  main_alb_zone_id     = var.main_alb_zone_id
  monitor_alb_dns_name = var.monitor_alb_dns_name
}

# ============================================================================
# Kubernetes Module
# ============================================================================
module "kubernetes" {
  source = "./modules/kubernetes"

  cluster_name           = var.kubernetes_cluster_name
  cluster_endpoint       = module.eks.cluster_endpoint
  cluster_ca_certificate = module.eks.cluster_certificate_authority_data
  namespaces             = var.kubernetes_namespaces
  common_tags            = local.common_tags

  depends_on = [
    module.eks
  ]
}
