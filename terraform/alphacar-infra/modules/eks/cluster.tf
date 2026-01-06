# EKS Cluster
resource "aws_eks_cluster" "apc_eks_cluster" {
  name     = "apc-eks-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = "1.34" # Update with actual version

  vpc_config {
    subnet_ids              = var.cluster_subnet_ids
    endpoint_private_access = false
    endpoint_public_access  = true
    security_group_ids      = [var.cluster_security_group_id]
  }

  encryption_config {
    provider {
      key_arn = var.kms_key_arn # Optional, if KMS is used
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_service_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
  ]

  tags = merge(
    var.common_tags,
    {
      Name = "apc-eks-cluster"
    }
  )
}

# EKS Cluster IAM Role
resource "aws_iam_role" "eks_cluster_role" {
  name = "eksctl-apc-eks-cluster-cluster-ServiceRole-fqIRKgrdfAKE"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "eksctl-apc-eks-cluster-cluster-ServiceRole-fqIRKgrdfAKE"
    }
  )
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

resource "aws_iam_role_policy_attachment" "eks_service_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSServicePolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster_role.name
}
