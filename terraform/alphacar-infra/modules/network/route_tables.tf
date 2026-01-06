# Route Tables

# EKS VPC - Private Route Table (DB + App subnets)
resource "aws_route_table" "eks_private" {
  vpc_id = aws_vpc.apc_eks_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.eks_nat.id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "apc-eks-vpc-private-rt"
    }
  )
}

# EKS VPC - Public Route Table
resource "aws_route_table" "eks_public" {
  vpc_id = aws_vpc.apc_eks_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.eks_igw.id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "apc-eks-vpc-public-rt"
    }
  )
}

# CICD VPC - Public Route Table
resource "aws_route_table" "cicd_public" {
  vpc_id = aws_vpc.apc_cicd_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.cicd_igw.id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "apc-cicd-vpc-public-rt"
    }
  )
}

# Route Table Associations
# EKS Private
resource "aws_route_table_association" "eks_private_db_a" {
  subnet_id      = aws_subnet.eks_private_db_a.id
  route_table_id = aws_route_table.eks_private.id
}

resource "aws_route_table_association" "eks_private_db_b" {
  subnet_id      = aws_subnet.eks_private_db_b.id
  route_table_id = aws_route_table.eks_private.id
}

resource "aws_route_table_association" "eks_private_app_a" {
  subnet_id      = aws_subnet.eks_private_app_a.id
  route_table_id = aws_route_table.eks_private.id
}

resource "aws_route_table_association" "eks_private_app_b" {
  subnet_id      = aws_subnet.eks_private_app_b.id
  route_table_id = aws_route_table.eks_private.id
}

# EKS Public
resource "aws_route_table_association" "eks_public_a" {
  subnet_id      = aws_subnet.eks_public_a.id
  route_table_id = aws_route_table.eks_public.id
}

resource "aws_route_table_association" "eks_public_b" {
  subnet_id      = aws_subnet.eks_public_b.id
  route_table_id = aws_route_table.eks_public.id
}

# CICD Public
resource "aws_route_table_association" "cicd_public_c" {
  subnet_id      = aws_subnet.cicd_public_c.id
  route_table_id = aws_route_table.cicd_public.id
}
