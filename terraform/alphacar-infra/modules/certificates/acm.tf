# ACM Certificates
# Note: ACM certificates are typically requested via console or imported
# For existing certificates, we'll use data source to reference them

# Data source for existing ACM certificate
data "aws_acm_certificate" "main_cert" {
  domain   = "www.${var.domain_name}"
  statuses = ["ISSUED"]
}

# If you need to create a new certificate (uncomment and configure):
# resource "aws_acm_certificate" "main_cert" {
#   domain_name       = "www.${var.domain_name}"
#   validation_method = "DNS"
#
#   subject_alternative_names = [
#     var.domain_name
#   ]
#
#   lifecycle {
#     create_before_destroy = true
#   }
#
#   tags = merge(
#     var.common_tags,
#     {
#       Name = "${var.domain_name}-cert"
#     }
#   )
# }
