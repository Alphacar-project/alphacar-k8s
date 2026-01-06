output "vpn_gateway_id" {
  description = "AWS VPN Gateway ID"
  value       = aws_vpn_gateway.aws_vpn_gw.id
}

output "vpn_gateway_ip_1" {
  description = "AWS VPN Connection 1 Outside IP Address"
  value       = aws_vpn_connection.gcp_vpn1.tunnel1_address
}

output "vpn_gateway_ip_2" {
  description = "AWS VPN Connection 2 Outside IP Address"
  value       = aws_vpn_connection.gcp_vpn2.tunnel1_address
}

output "vpn_connection_1_id" {
  description = "VPN Connection 1 ID"
  value       = aws_vpn_connection.gcp_vpn1.id
}

output "vpn_connection_2_id" {
  description = "VPN Connection 2 ID"
  value       = aws_vpn_connection.gcp_vpn2.id
}

output "shared_secret_1" {
  description = "Pre-shared key for VPN tunnel 1"
  value       = aws_vpn_connection.gcp_vpn1.tunnel1_preshared_key
  sensitive   = true
}

output "shared_secret_2" {
  description = "Pre-shared key for VPN tunnel 2"
  value       = aws_vpn_connection.gcp_vpn2.tunnel1_preshared_key
  sensitive   = true
}
