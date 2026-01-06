variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "cluster_endpoint" {
  description = "EKS cluster endpoint"
  type        = string
}

variable "cluster_ca_certificate" {
  description = "EKS cluster CA certificate (base64 encoded)"
  type        = string
}

variable "namespaces" {
  description = "List of Kubernetes namespaces to create"
  type        = list(string)
  default = [
    "apc-be-ns",
    "apc-fe-ns",
    "apc-db-ns",
    "apc-obsv-ns",
    "apc-fin-ns",
    "apc-ek-ns",
    "apc-backup-ns",
    "apc-striming-ns",
    "admin",
    "load-test"
  ]
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
