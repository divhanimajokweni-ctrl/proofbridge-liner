terraform {
  required_providers {
    datadog = {
      source  = "DataDog/datadog"
      version = "~> 3.0"
    }
  }
}

provider "datadog" {
  # API and App keys are automatically picked up from DATADOG_API_KEY and DATADOG_APP_KEY env vars
}

# Monitor for P99 Latency (Ceiling: 250ms)
resource "datadog_monitor" "p99_latency" {
  name    = "VVUP Platform P99 Latency Breach"
  type    = "metric alert"
  message = "Notification: P99 latency has breached the 250ms compliance threshold in region {{region.name}}. Notify: @pagerduty-VVUP-Core-OnCall"

  query = "avg(last_5m):p99:vvup.api.latency{env:production} by {region} > 250"

  monitor_thresholds {
    critical = 250
  }

  tags = ["env:production", "team:vvup-core", "service:backend"]
}

# Monitor for Security Deflection Spikes
resource "datadog_monitor" "security_deflections" {
  name    = "VVUP Platform Security Error Deflection Spike"
  type    = "query alert"
  message = "Notification: High volume of security deflections detected. Potential attack vectors active. Notify: @pagerduty-VVUP-Core-OnCall"

  query = "sum(last_5m):sum:vvup.security.deflections{env:production}.as_count() > 50"

  monitor_thresholds {
    critical = 50
  }

  tags = ["env:production", "team:vvup-core", "security:compliance"]
}
