terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

provider "github" {
  owner = var.github_owner
  token = var.github_token
}

variable "secrets" {
  type = map(string)
  description = "Map of all production secrets to be synced"
  sensitive = true
}

variable "github_owner" { type = string }
variable "github_repo" { type = string }
variable "github_token" {
  type      = string
  sensitive = true
}
variable "replit_id" { type = string }
variable "replit_api_key" {
  type      = string
  sensitive = true
}

# 1. Manage GitHub Repository Secrets
resource "github_actions_secret" "secrets" {
  for_each        = var.secrets
  repository      = var.github_repo
  secret_name     = each.key
  value           = each.value
}

# 2. Sync to Replit Environment (Kilo CLI)
# Since no native Replit provider exists, we use the GraphQL API via cURL
resource "null_resource" "replit_secrets" {
  for_each = var.secrets

  triggers = {
    secret_hash = sha256(each.value)
    repl_id     = var.replit_id
    secret_name = each.key
  }

  provisioner "local-exec" {
    command = <<EOT
      RESPONSE=$(curl --fail -s -X POST https://replit.com/graphql \
        -H "X-Replit-Identity: $REPLIT_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")
      
      if echo "$RESPONSE" | grep -q '"errors"'; then
        echo "GraphQL Error: $RESPONSE"
        exit 1
      fi
    EOT

    environment = {
      REPLIT_API_KEY = var.replit_api_key
      PAYLOAD = jsonencode({
        query = "mutation SetSecret($replId: String!, $name: String!, $value: String!) { setSecret(replId: $replId, name: $name, value: $value) { id } }"
        variables = {
          replId = var.replit_id
          name   = each.key
          value  = each.value
        }
      })
    }
  }

  provisioner "local-exec" {
    when    = destroy
    command = <<EOT
      curl --fail -s -X POST https://replit.com/graphql \
        -H "X-Replit-Identity: $REPLIT_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD"
    EOT

    environment = {
      REPLIT_API_KEY = var.replit_api_key
      PAYLOAD = jsonencode({
        query = "mutation DeleteSecret($replId: String!, $name: String!) { deleteSecret(replId: $replId, name: $name) }"
        variables = {
          replId = self.triggers.repl_id
          name   = self.triggers.secret_name
        }
      })
    }
  }
}

output "sync_status" {
  value = "Secrets successfully synchronized across GitHub and Replit."
}