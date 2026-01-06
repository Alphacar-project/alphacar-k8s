# VPC Resources
resource "aws_vpc" "apc_eks_vpc" {
  cidr_block           = "10.10.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name = "apc-eks-vpc"
    }
  )
}

resource "aws_vpc" "apc_cicd_vpc" {
  cidr_block           = "172.31.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name = "apc-cicd-vpc"
    }
  )
}
