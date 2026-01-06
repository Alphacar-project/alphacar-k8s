# EC2 Instances

# Bastion Host
resource "aws_instance" "bastion" {
  ami           = var.bastion_ami_id # Amazon Linux 2023 AMI
  instance_type = "t3.medium"
  key_name      = var.key_pair_name

  subnet_id                   = var.bastion_subnet_id
  vpc_security_group_ids      = [var.bastion_security_group_id]
  associate_public_ip_address = true

  iam_instance_profile = var.bastion_iam_instance_profile_name

  tags = merge(
    var.common_tags,
    {
      Name = "apc-bastion"
    }
  )
}

# Jenkins Server
resource "aws_instance" "jenkins" {
  ami           = var.jenkins_ami_id # Amazon Linux 2023 AMI
  instance_type = "c5a.xlarge"
  key_name      = var.key_pair_name

  subnet_id              = var.jenkins_subnet_id
  vpc_security_group_ids = [var.jenkins_security_group_id]

  iam_instance_profile = var.jenkins_iam_instance_profile_name

  # EBS volume은 별도로 관리 (필요시)

  tags = merge(
    var.common_tags,
    {
      Name = "apc-cicd-vpc-prv-jenkins"
    }
  )
}

