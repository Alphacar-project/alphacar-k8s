# Kubernetes Namespaces

resource "kubernetes_namespace" "namespaces" {
  for_each = toset(var.namespaces)

  metadata {
    name = each.value
    labels = merge(
      var.common_tags,
      {
        managed-by = "terraform"
      }
    )
  }
}

