# Kubernetes Provider Configuration
# This module requires the Kubernetes provider to be configured in the root module

# Data source to get EKS cluster authentication
data "aws_eks_cluster" "cluster" {
  name = var.cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = var.cluster_name
}

