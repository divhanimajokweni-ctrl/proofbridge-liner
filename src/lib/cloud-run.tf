# Google Cloud Run Service with Datadog Sidecar for VVUP Platform

provider "google" {
  project = "project-cc455a72-1490-4cdf-b0e"
  region  = "us-central1"
}

resource "google_cloud_run_service" "vvup_risk_engine" {
  name     = "vvup-risk-engine"
  location = "us-central1"

  template {
    metadata {
      annotations = {
        # Correctly formatted container-dependencies annotation
        "run.googleapis.com/container-dependencies" = jsonencode({ main-app = ["sidecar-container"] })
      }
      labels = {
        service = "vvup-risk-engine"
      }
    }

    spec {
      # Define shared volume
      volumes {
        name = "shared-volume"
        empty_dir {
          medium = "Memory"
        }
      }

      # Main application container (VVUP Risk Engine)
      containers {
        name  = "main-app"
        image = "gcr.io/project-cc455a72-1490-4cdf-b0e/vvup-risk-engine:latest"

        # Expose a port for the main container
        ports {
          container_port = "8080"
        }

        # Mount the shared volume
        volume_mounts {
          name       = "shared-volume"
          mount_path = "/shared-volume"
        }

        # Startup Probe for TCP Health Check
        startup_probe {
          tcp_socket {
            port = "8080"
          }
          initial_delay_seconds = 0
          period_seconds        = 10
          failure_threshold     = 3
          timeout_seconds       = 1
        }

        # Environment variables for the main container
        env {
          name  = "DD_SERVICE"
          value = "vvup-risk-engine"
        }
        env {
          name  = "NODE_OPTIONS"
          value = "--require dd-trace/init"
        }

        # Resource limits for the main container
        resources {
          limits = {
            memory = "512Mi"
            cpu    = "1"
          }
        }
      }

      # Sidecar container (Datadog Serverless Init)
      containers {
        name  = "sidecar-container"
        image = "gcr.io/datadoghq/serverless-init:latest"

        # Mount the shared volume
        volume_mounts {
          name       = "shared-volume"
          mount_path = "/shared-volume"
        }

        # Startup Probe for TCP Health Check
        startup_probe {
          tcp_socket {
            port = 12345
          }
          initial_delay_seconds = 0
          period_seconds        = 10
          failure_threshold     = 3
          timeout_seconds       = 1
        }

        # Environment variables for the sidecar container
        env {
          name  = "DD_SITE"
          value = "datadoghq.com"
        }
        env {
          name  = "DD_SERVERLESS_LOG_PATH"
          value = "shared-volume/logs/*.log"
        }
        env {
          name  = "DD_ENV"
          value = "production"
        }
        env {
          name  = "DD_API_KEY"
          # This should be injected via environment variables or secret manager in production
          value = var.datadog_api_key
        }
        env {
          name  = "DD_SERVICE"
          value = "vvup-risk-engine"
        }
        env {
          name  = "DD_VERSION"
          value = "2.1.0"
        }
        env {
          name  = "DD_LOG_LEVEL"
          value = "debug"
        }
        env {
          name  = "DD_LOGS_INJECTION"
          value = "true"
        }
        env {
          name  = "DD_HEALTH_PORT"
          value = "12345"
        }
        # Resource limits for the sidecar
        resources {
          limits = {
            memory = "512Mi"
            cpu    = "1"
          }
        }
      }
    }
  }

  # Define traffic splitting
  traffic {
    percent         = 100
    latest_revision = true
  }
}

# IAM Member to allow public access (adjust as needed)
resource "google_cloud_run_service_iam_member" "invoker" {
  service  = google_cloud_run_service.vvup_risk_engine.name
  location = google_cloud_run_service.vvup_risk_engine.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

variable "datadog_api_key" {
  type      = string
  sensitive = true
}
