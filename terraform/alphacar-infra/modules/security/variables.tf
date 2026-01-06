variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "eks_vpc_id" {
  description = "EKS VPC ID"
  type        = string
}

variable "cicd_vpc_id" {
  description = "CICD VPC ID"
  type        = string
}
