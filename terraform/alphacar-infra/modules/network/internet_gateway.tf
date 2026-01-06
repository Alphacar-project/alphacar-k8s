# Internet Gateways
resource "aws_internet_gateway" "eks_igw" {
  vpc_id = aws_vpc.apc_eks_vpc.id

  tags = merge(
    var.common_tags,
    {
      Name = "apc-eks-vpc-igw"
    }
  )
}

resource "aws_internet_gateway" "cicd_igw" {
  vpc_id = aws_vpc.apc_cicd_vpc.id

  tags = merge(
    var.common_tags,
    {
      Name = "apc-cicd-vpc-igw"
    }
  )
}
