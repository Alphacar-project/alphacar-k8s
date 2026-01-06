output "eks_vpc_id" {
  description = "EKS VPC ID"
  value       = aws_vpc.apc_eks_vpc.id
}

output "cicd_vpc_id" {
  description = "CICD VPC ID"
  value       = aws_vpc.apc_cicd_vpc.id
}

output "eks_subnet_ids" {
  description = "EKS VPC Subnet IDs"
  value = {
    private_db_a  = aws_subnet.eks_private_db_a.id
    private_db_b  = aws_subnet.eks_private_db_b.id
    private_app_a = aws_subnet.eks_private_app_a.id
    private_app_b = aws_subnet.eks_private_app_b.id
    public_a      = aws_subnet.eks_public_a.id
    public_b      = aws_subnet.eks_public_b.id
  }
}

output "cicd_subnet_id" {
  description = "CICD VPC Subnet ID"
  value       = aws_subnet.cicd_public_c.id
}
