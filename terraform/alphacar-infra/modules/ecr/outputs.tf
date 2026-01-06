output "repository_urls" {
  description = "ECR repository URLs"
  value = {
    for repo in aws_ecr_repository.repositories : repo.name => repo.repository_url
  }
}

output "repository_arns" {
  description = "ECR repository ARNs"
  value = {
    for repo in aws_ecr_repository.repositories : repo.name => repo.arn
  }
}

