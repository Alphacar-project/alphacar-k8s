# AWS VPN 모듈
# GCP와의 VPN 연결을 위한 AWS 측 설정

# Customer Gateway (GCP VPN Gateway를 가리킴)
resource "aws_customer_gateway" "gcp_cgw" {
  bgp_asn    = 65000
  ip_address = var.gcp_vpn_gateway_ip
  type       = "ipsec.1"

  tags = merge(
    var.common_tags,
    {
      Name = "apc-gcp-customer-gateway"
    }
  )
}

# VPN Gateway
resource "aws_vpn_gateway" "aws_vpn_gw" {
  vpc_id = var.vpc_id

  tags = merge(
    var.common_tags,
    {
      Name = "apc-aws-vpn-gateway"
    }
  )
}

# Attach VPN Gateway to VPC
resource "aws_vpn_gateway_attachment" "vpn_gw_attachment" {
  vpc_id         = var.vpc_id
  vpn_gateway_id = aws_vpn_gateway.aws_vpn_gw.id
}

# VPN Connection 1
resource "aws_vpn_connection" "gcp_vpn1" {
  vpn_gateway_id      = aws_vpn_gateway.aws_vpn_gw.id
  customer_gateway_id = aws_customer_gateway.gcp_cgw.id
  type                = "ipsec.1"
  static_routes_only  = false

  tags = merge(
    var.common_tags,
    {
      Name = "apc-gcp-vpn-connection-1"
    }
  )
}

# VPN Connection 2 (HA를 위한 두 번째 연결)
resource "aws_vpn_connection" "gcp_vpn2" {
  vpn_gateway_id      = aws_vpn_gateway.aws_vpn_gw.id
  customer_gateway_id = aws_customer_gateway.gcp_cgw.id
  type                = "ipsec.1"
  static_routes_only  = false

  tags = merge(
    var.common_tags,
    {
      Name = "apc-gcp-vpn-connection-2"
    }
  )
}

# Route to GCP VPC (Main Route Table)
resource "aws_route" "gcp_route_main" {
  count                  = length(var.route_table_ids)
  route_table_id         = var.route_table_ids[count.index]
  destination_cidr_block = var.gcp_vpc_cidr
  gateway_id             = aws_vpn_gateway.aws_vpn_gw.id

  depends_on = [aws_vpn_gateway_attachment.vpn_gw_attachment]
}
