# NAT Gateway (EKS VPC only)
resource "aws_eip" "eks_nat_eip" {
  domain = "vpc"

  tags = merge(
    var.common_tags,
    {
      Name = "apc-eks-vpc-nat-eip"
    }
  )
}

resource "aws_nat_gateway" "eks_nat" {
  allocation_id = aws_eip.eks_nat_eip.id
  subnet_id     = aws_subnet.eks_public_a.id

  tags = merge(
    var.common_tags,
    {
      Name = "apc-eks-vpc-nat"
    }
  )

  depends_on = [aws_internet_gateway.eks_igw]
}
