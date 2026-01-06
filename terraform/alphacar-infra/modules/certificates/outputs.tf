output "certificate_arn" {
  description = "ACM Certificate ARN"
  value       = data.aws_acm_certificate.main_cert.arn
}

output "certificate_domain" {
  description = "ACM Certificate domain"
  value       = data.aws_acm_certificate.main_cert.domain
}

