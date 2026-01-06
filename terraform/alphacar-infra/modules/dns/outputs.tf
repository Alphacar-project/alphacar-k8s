output "zone_id" {
  description = "Route 53 Hosted Zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "zone_name" {
  description = "Route 53 Hosted Zone name"
  value       = aws_route53_zone.main.name
}
