variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "cluster_subnet_ids" {
  description = "List of subnet IDs for EKS cluster"
  type        = list(string)
}

variable "cluster_security_group_id" {
  description = "Security group ID for EKS cluster"
  type        = string
}

variable "node_group_subnet_ids" {
  description = "List of subnet IDs for node group"
  type        = list(string)
}

variable "node_group_role_arn" {
  description = "IAM role ARN for node group"
  type        = string
}

variable "node_group_role_name" {
  description = "IAM role name for node group"
  type        = string
}

variable "node_group_security_group_id" {
  description = "Security group ID for node group remote access"
  type        = string
}

variable "ec2_ssh_key" {
  description = "EC2 SSH key name for node group"
  type        = string
  default     = ""
}

variable "kms_key_arn" {
  description = "KMS key ARN for cluster encryption (optional)"
  type        = string
  default     = ""
}
