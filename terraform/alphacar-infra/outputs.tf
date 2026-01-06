# Outputs

# Network Outputs
output "eks_vpc_id" {
  description = "EKS VPC ID"
  value       = module.network.eks_vpc_id
}

output "cicd_vpc_id" {
  description = "CICD VPC ID"
  value       = module.network.cicd_vpc_id
}

# EKS Outputs
output "eks_cluster_id" {
  description = "EKS Cluster ID"
  value       = module.eks.cluster_id
}

output "eks_cluster_endpoint" {
  description = "EKS Cluster endpoint"
  value       = module.eks.cluster_endpoint
}

# Compute Outputs
output "bastion_public_ip" {
  description = "Bastion host public IP"
  value       = module.compute.bastion_public_ip
}

output "jenkins_private_ip" {
  description = "Jenkins server private IP"
  value       = module.compute.jenkins_private_ip
}

# ECR Outputs
output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

# Certificate Outputs
output "certificate_arn" {
  description = "ACM Certificate ARN"
  value       = module.certificates.certificate_arn
}

# DNS Outputs
output "route53_zone_id" {
  description = "Route 53 Hosted Zone ID"
  value       = module.dns.zone_id
}

# Kubernetes Outputs
output "kubernetes_namespaces" {
  description = "Created Kubernetes namespaces"
  value       = module.kubernetes.namespace_names
}
