# Kubernetes Provider Configuration
# Note: This provider will use data sources to connect to the EKS cluster
# The cluster must exist before Kubernetes resources can be created

# Data source for EKS cluster (used by Kubernetes provider)
data "aws_eks_cluster" "eks_cluster" {
  name = var.kubernetes_cluster_name
}

# Data source for EKS cluster authentication
data "aws_eks_cluster_auth" "kubernetes" {
  name = var.kubernetes_cluster_name
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.eks_cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.eks_cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.kubernetes.token
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      var.kubernetes_cluster_name
    ]
  }
}

# Helm Provider Configuration
provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.eks_cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.eks_cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.kubernetes.token
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args = [
        "eks",
        "get-token",
        "--cluster-name",
        var.kubernetes_cluster_name
      ]
    }
  }
}
