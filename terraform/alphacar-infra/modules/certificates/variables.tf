variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "domain_name" {
  description = "Domain name for ACM certificate"
  type        = string
  default     = "alphacar.cloud"
}

