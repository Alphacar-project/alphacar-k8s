# EKS VPC Subnets
# Private DB Subnets
resource "aws_subnet" "eks_private_db_a" {
  vpc_id                  = aws_vpc.apc_eks_vpc.id
  cidr_block              = "10.10.8.0/22"
  availability_zone       = "ap-northeast-2a"
  map_public_ip_on_launch = false

  tags = merge(
    var.common_tags,
    {
      Name = "apc-subnet-private-db-a"
    }
  )
}

resource "aws_subnet" "eks_private_db_b" {
  vpc_id                  = aws_vpc.apc_eks_vpc.id
  cidr_block              = "10.10.12.0/22"
  availability_zone       = "ap-northeast-2b"
  map_public_ip_on_launch = false

  tags = merge(
    var.common_tags,
    {
      Name = "apc-subnet-private-db-b"
    }
  )
}

# Private App Subnets
resource "aws_subnet" "eks_private_app_a" {
  vpc_id                  = aws_vpc.apc_eks_vpc.id
  cidr_block              = "10.10.2.0/23"
  availability_zone       = "ap-northeast-2a"
  map_public_ip_on_launch = false

  tags = merge(
    var.common_tags,
    {
      Name = "apc-subnet-private-app-a"
    }
  )
}

resource "aws_subnet" "eks_private_app_b" {
  vpc_id                  = aws_vpc.apc_eks_vpc.id
  cidr_block              = "10.10.4.0/23"
  availability_zone       = "ap-northeast-2b"
  map_public_ip_on_launch = false

  tags = merge(
    var.common_tags,
    {
      Name = "apc-subnet-private-app-b"
    }
  )
}

# Public Subnets
resource "aws_subnet" "eks_public_a" {
  vpc_id                  = aws_vpc.apc_eks_vpc.id
  cidr_block              = "10.10.0.0/24"
  availability_zone       = "ap-northeast-2a"
  map_public_ip_on_launch = false

  tags = merge(
    var.common_tags,
    {
      Name = "apc-subnet-public-a"
    }
  )
}

resource "aws_subnet" "eks_public_b" {
  vpc_id                  = aws_vpc.apc_eks_vpc.id
  cidr_block              = "10.10.1.0/24"
  availability_zone       = "ap-northeast-2b"
  map_public_ip_on_launch = false

  tags = merge(
    var.common_tags,
    {
      Name = "apc-subnet-public-b"
    }
  )
}

# CICD VPC Subnets
resource "aws_subnet" "cicd_public_c" {
  vpc_id                  = aws_vpc.apc_cicd_vpc.id
  cidr_block              = "172.31.32.0/20"
  availability_zone       = "ap-northeast-2c"
  map_public_ip_on_launch = true

  tags = merge(
    var.common_tags,
    {
      Name = "apc-subnet-public-cicd-a"
    }
  )
}
