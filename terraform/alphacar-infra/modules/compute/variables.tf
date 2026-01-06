variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "bastion_ami_id" {
  description = "AMI ID for Bastion host"
  type        = string
}

variable "bastion_subnet_id" {
  description = "Subnet ID for Bastion host"
  type        = string
}

variable "bastion_security_group_id" {
  description = "Security Group ID for Bastion host"
  type        = string
}

variable "bastion_iam_instance_profile_name" {
  description = "IAM Instance Profile name for Bastion host"
  type        = string
}

variable "jenkins_ami_id" {
  description = "AMI ID for Jenkins server"
  type        = string
}

variable "jenkins_subnet_id" {
  description = "Subnet ID for Jenkins server"
  type        = string
}

variable "jenkins_security_group_id" {
  description = "Security Group ID for Jenkins server"
  type        = string
}

variable "jenkins_iam_instance_profile_name" {
  description = "IAM Instance Profile name for Jenkins server"
  type        = string
}

variable "key_pair_name" {
  description = "Key pair name for EC2 instances"
  type        = string
}

