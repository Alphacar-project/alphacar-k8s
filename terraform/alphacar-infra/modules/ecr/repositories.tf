# ECR Repositories

resource "aws_ecr_repository" "repositories" {
  for_each = toset(var.repository_names)

  name                 = each.value
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(
    var.common_tags,
    {
      Name = each.value
    }
  )
}

# Lifecycle policy (optional - 이미지 보관 정책)
resource "aws_ecr_lifecycle_policy" "repository_policy" {
  for_each = toset(var.repository_names)

  repository = aws_ecr_repository.repositories[each.value].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

