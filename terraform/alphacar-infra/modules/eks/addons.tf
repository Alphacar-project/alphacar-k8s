# EKS Add-ons
# Note: addon_version must be a specific version, not "latest"
# Check available versions: aws eks describe-addon-versions --addon-name vpc-cni

resource "aws_eks_addon" "vpc_cni" {
  cluster_name = aws_eks_cluster.apc_eks_cluster.name
  addon_name   = "vpc-cni"
  # addon_version            = "v1.18.0-eksbuild.1"  # Specify version
  service_account_role_arn = aws_iam_role.vpc_cni_role.arn

  tags = merge(
    var.common_tags,
    {
      Name = "vpc-cni"
    }
  )

  depends_on = [aws_eks_cluster.apc_eks_cluster]
}

resource "aws_eks_addon" "coredns" {
  cluster_name = aws_eks_cluster.apc_eks_cluster.name
  addon_name   = "coredns"
  # addon_version = "v1.11.1-eksbuild.4"  # Specify version

  tags = merge(
    var.common_tags,
    {
      Name = "coredns"
    }
  )

  depends_on = [aws_eks_cluster.apc_eks_cluster]
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name = aws_eks_cluster.apc_eks_cluster.name
  addon_name   = "kube-proxy"
  # addon_version = "v1.28.4-eksbuild.1"  # Specify version

  tags = merge(
    var.common_tags,
    {
      Name = "kube-proxy"
    }
  )

  depends_on = [aws_eks_cluster.apc_eks_cluster]
}

resource "aws_eks_addon" "metrics_server" {
  cluster_name = aws_eks_cluster.apc_eks_cluster.name
  addon_name   = "metrics-server"
  # addon_version = "v0.7.1-eksbuild.1"  # Specify version

  tags = merge(
    var.common_tags,
    {
      Name = "metrics-server"
    }
  )

  depends_on = [aws_eks_cluster.apc_eks_cluster]
}

# VPC CNI IAM Role (if needed)
resource "aws_iam_role" "vpc_cni_role" {
  name = "AmazonEKSVPCCNIRole-apc-eks-cluster"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.eks_oidc_provider.arn
        }
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.eks_oidc_provider.url, "https://", "")}:sub" : "system:serviceaccount:kube-system:aws-node"
            "${replace(aws_iam_openid_connect_provider.eks_oidc_provider.url, "https://", "")}:aud" : "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = merge(
    var.common_tags,
    {
      Name = "AmazonEKSVPCCNIRole-apc-eks-cluster"
    }
  )
}

# EKS OIDC Provider (needed for add-ons)
data "tls_certificate" "eks_cluster" {
  url = aws_eks_cluster.apc_eks_cluster.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks_oidc_provider" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks_cluster.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.apc_eks_cluster.identity[0].oidc[0].issuer

  tags = merge(
    var.common_tags,
    {
      Name = "eks-oidc-provider-apc-eks-cluster"
    }
  )
}
