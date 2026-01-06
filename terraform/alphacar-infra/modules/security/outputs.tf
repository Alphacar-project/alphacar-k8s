output "security_group_ids" {
  description = "Security Group IDs"
  value = {
    mongodb_replicaset = aws_security_group.mongodb_replicaset_sg.id
    ek_stack           = aws_security_group.ek_stack_sg.id
    ssh_access         = aws_security_group.ssh_access_sg.id
    sonarqube          = aws_security_group.sonarqube_sg.id
    eks_cluster        = aws_security_group.eks_cluster_sg.id
    eks_nodegroup      = aws_security_group.eks_nodegroup_remote_access.id
  }
}

output "node_group_role_arn" {
  description = "EKS Node Group IAM Role ARN"
  value       = aws_iam_role.eks_node_instance_role.arn
}

output "node_group_role_name" {
  description = "EKS Node Group IAM Role Name"
  value       = aws_iam_role.eks_node_instance_role.name
}

output "instance_profile_names" {
  description = "IAM Instance Profile Names"
  value = {
    bastion  = aws_iam_instance_profile.bastion_admin_profile.name
    jenkins  = aws_iam_instance_profile.jenkins_ecr_profile.name
    eks_node = aws_iam_instance_profile.eks_node_instance_profile.name
  }
}
