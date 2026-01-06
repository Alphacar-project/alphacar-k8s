# EKS Node Group
resource "aws_eks_node_group" "apc_nodegroup" {
  cluster_name    = aws_eks_cluster.apc_eks_cluster.name
  node_group_name = "apc-nodegroup"
  node_role_arn   = var.node_group_role_arn
  subnet_ids      = var.node_group_subnet_ids
  instance_types  = ["m7i.large"]
  capacity_type   = "ON_DEMAND"
  disk_size       = 20

  scaling_config {
    desired_size = 2
    min_size     = 2
    max_size     = 10
  }

  update_config {
    max_unavailable = 1
  }

  remote_access {
    ec2_ssh_key               = var.ec2_ssh_key
    source_security_group_ids = [var.node_group_security_group_id]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]

  tags = merge(
    var.common_tags,
    {
      Name = "apc-nodegroup"
    }
  )
}

# Node Group IAM Role Policies
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = var.node_group_role_name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = var.node_group_role_name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = var.node_group_role_name
}
