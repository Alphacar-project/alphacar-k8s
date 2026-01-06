variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "main_alb_dns_name" {
  description = "Main ALB DNS name"
  type        = string
}

variable "main_alb_zone_id" {
  description = "Main ALB zone ID"
  type        = string
}

variable "monitor_alb_dns_name" {
  description = "Monitor ALB DNS name"
  type        = string
}

variable "domain_name" {
  description = "Domain name for Route 53"
  type        = string
  default     = "alphacar.cloud"
}
