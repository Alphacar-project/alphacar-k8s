# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = merge(
    var.common_tags,
    {
      Name = var.domain_name
    }
  )
}

# Route 53 Records
resource "aws_route53_record" "main_a" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.main_alb_dns_name
    zone_id                = var.main_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "www_a" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.main_alb_dns_name
    zone_id                = var.main_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "monitor_cname" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "monitor.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.monitor_alb_dns_name]
}
