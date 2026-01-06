variable "vpc_id" {
  description = "AWS VPC ID"
  type        = string
}

variable "gcp_vpn_gateway_ip" {
  description = "GCP VPN Gateway External IP address"
  type        = string
}

variable "gcp_vpc_cidr" {
  description = "GCP VPC CIDR block for routing"
  type        = string
  default     = "10.10.0.0/16"
}

variable "route_table_ids" {
  description = "List of route table IDs to add GCP routes"
  type        = list(string)
  default     = []
}

variable "common_tags" {
  description = "Common tags for resources"
  type        = map(string)
  default     = {}
}
