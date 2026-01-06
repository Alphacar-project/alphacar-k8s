# IAM Roles

# EKS Node Instance Role
resource "aws_iam_role" "eks_node_instance_role" {
  name = "eksctl-apc-eks-cluster-nodegroup-a-NodeInstanceRole-C0oJqxGqlNrY"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "eksctl-apc-eks-cluster-nodegroup-a-NodeInstanceRole-C0oJqxGqlNrY"
    }
  )
}

# Bastion Admin Role
resource "aws_iam_role" "bastion_admin_role" {
  name = "apc-bastion-admin-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "apc-bastion-admin-role"
    }
  )
}

# Jenkins ECR Role
resource "aws_iam_role" "jenkins_ecr_role" {
  name = "Jenkins-ECR-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "Jenkins-ECR-Role"
    }
  )
}

# IAM Instance Profiles
resource "aws_iam_instance_profile" "eks_node_instance_profile" {
  name = "eks-facdb71d-b502-0468-ceb4-698e8c303bd5"
  role = aws_iam_role.eks_node_instance_role.name

  tags = merge(
    var.common_tags,
    {
      Name = "eks-facdb71d-b502-0468-ceb4-698e8c303bd5"
    }
  )
}

resource "aws_iam_instance_profile" "bastion_admin_profile" {
  name = "apc-bastion-admin-role"
  role = aws_iam_role.bastion_admin_role.name

  tags = merge(
    var.common_tags,
    {
      Name = "apc-bastion-admin-role"
    }
  )
}

resource "aws_iam_instance_profile" "jenkins_ecr_profile" {
  name = "Jenkins-ECR-Role"
  role = aws_iam_role.jenkins_ecr_role.name

  tags = merge(
    var.common_tags,
    {
      Name = "Jenkins-ECR-Role"
    }
  )
}
