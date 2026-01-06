# Security Groups

# MongoDB Replicaset Security Group
resource "aws_security_group" "mongodb_replicaset_sg" {
  name        = "apc-mongodb-replicaset-sg"
  description = "Security group for MongoDB replicaset"
  vpc_id      = var.eks_vpc_id

  tags = merge(
    var.common_tags,
    {
      Name = "apc-mongodb-replicaset-sg"
    }
  )
}

# Elasticsearch Stack Security Group
resource "aws_security_group" "ek_stack_sg" {
  name        = "apc-ek-stack-sg"
  description = "Security group for Elasticsearch stack"
  vpc_id      = var.eks_vpc_id

  tags = merge(
    var.common_tags,
    {
      Name = "apc-ek-stack-sg"
    }
  )
}

# SSH Access Security Group (Bastion)
resource "aws_security_group" "ssh_access_sg" {
  name        = "apc-ssh-access-sg"
  description = "Security group for SSH access"
  vpc_id      = var.eks_vpc_id

  tags = merge(
    var.common_tags,
    {
      Name = "apc-ssh-access-sg"
    }
  )
}

# SonarQube Security Group (Jenkins)
resource "aws_security_group" "sonarqube_sg" {
  name        = "apc-sonarqube-sg"
  description = "Security group for SonarQube/Jenkins"
  vpc_id      = var.cicd_vpc_id

  tags = merge(
    var.common_tags,
    {
      Name = "apc-sonarqube-sg"
    }
  )
}

# EKS Cluster Security Groups (will be imported separately)
# Note: EKS creates its own security groups, these are for reference
resource "aws_security_group" "eks_cluster_sg" {
  name        = "eks-cluster-sg-apc-eks-cluster-1582018177"
  description = "Security group for EKS cluster"
  vpc_id      = var.eks_vpc_id

  tags = merge(
    var.common_tags,
    {
      Name = "eks-cluster-sg-apc-eks-cluster-1582018177"
    }
  )
}

resource "aws_security_group" "eks_nodegroup_remote_access" {
  name        = "eksctl-apc-eks-cluster-nodegroup-apc-nodegroup-remoteAccess"
  description = "Security group for EKS nodegroup remote access"
  vpc_id      = var.eks_vpc_id

  tags = merge(
    var.common_tags,
    {
      Name = "eksctl-apc-eks-cluster-nodegroup-apc-nodegroup-remoteAccess"
    }
  )
}
