output "cluster_id" {
  description = "EKS Cluster ID"
  value       = aws_eks_cluster.apc_eks_cluster.id
}

output "cluster_arn" {
  description = "EKS Cluster ARN"
  value       = aws_eks_cluster.apc_eks_cluster.arn
}

output "cluster_endpoint" {
  description = "EKS Cluster endpoint"
  value       = aws_eks_cluster.apc_eks_cluster.endpoint
}

output "cluster_version" {
  description = "EKS Cluster version"
  value       = aws_eks_cluster.apc_eks_cluster.version
}

output "node_group_id" {
  description = "EKS Node Group ID"
  value       = aws_eks_node_group.apc_nodegroup.id
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.apc_eks_cluster.certificate_authority[0].data
}
