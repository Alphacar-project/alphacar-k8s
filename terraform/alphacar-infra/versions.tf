terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # 백엔드 설정 (나중에 S3로 설정 가능)
  # backend "s3" {
  #   bucket = "alphacar-terraform-state"
  #   key    = "infrastructure/terraform.tfstate"
  #   region = "ap-northeast-2"
  # }
}

provider "aws" {
  region = "ap-northeast-2"

  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Environment = "production"
      Project     = "alphacar"
    }
  }
}
