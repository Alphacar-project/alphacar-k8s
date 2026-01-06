variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "repository_names" {
  description = "List of ECR repository names"
  type        = list(string)
  default = [
    "alphacar/frontend",
    "alphacar/alphacar-main",
    "alphacar/alphacar-search",
    "alphacar/alphacar-community",
    "alphacar/alphacar-aichat",
    "alphacar/kafka-connect-s3",
    "alphacar/alphacar-news",
    "alphacar/alphacar-monitoring-analysis-frontend",
    "alphacar/alphacar-monitoring-analysis-backend",
    "alphacar/alphacar-quote",
    "alphacar/alphacar-mypage"
  ]
}

