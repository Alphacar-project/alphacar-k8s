output "bastion_instance_id" {
  description = "Bastion instance ID"
  value       = aws_instance.bastion.id
}

output "bastion_public_ip" {
  description = "Bastion public IP"
  value       = aws_instance.bastion.public_ip
}

output "jenkins_instance_id" {
  description = "Jenkins instance ID"
  value       = aws_instance.jenkins.id
}

output "jenkins_private_ip" {
  description = "Jenkins private IP"
  value       = aws_instance.jenkins.private_ip
}

