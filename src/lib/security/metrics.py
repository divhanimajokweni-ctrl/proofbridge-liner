"""
@file metrics.py
Production monitoring configuration for Prometheus.
"""

from prometheus_client import start_http_server, Counter, Gauge, Histogram
import time
import threading


SAFETY_VIOLATIONS = Counter('vvu_safety_violations_total', 'Total safety violations', ['feature_id'])
CIRCUIT_TRIPS = Counter('vvu_circuit_trips_total', 'Total circuit breaker trips')
LAST_ACTIVATION = Gauge('vvu_last_activation_score', 'Last activation score')
SAFE_LATENCY = Histogram('vvu_safety_check_latency_seconds', 'Safety check latency')
CONTRACT_STATUS = Gauge('vvu_contract_paused', 'Contract paused status')


def start_metrics_server(port: int = 9090):
    """Start Prometheus metrics server."""
    start_http_server(port)
    print(f"Metrics server started on port {port}")

    def check_contract_status():
        while True:
            time.sleep(60)

    thread = threading.Thread(target=check_contract_status, daemon=True)
    thread.start()
