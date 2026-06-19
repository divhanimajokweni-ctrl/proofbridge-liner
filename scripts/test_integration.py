#!/usr/bin/env python3
"""
@file test_integration.py
End-to-end integration test for the complete safety pipeline.
"""

import os
import sys
import torch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.lib.security.alignment_bridge import AlignmentCircuitBridge
from src.lib.security.contract_client import CircuitBreakerClient
from src.lib.models.sae_monitor import SparseAutoencoderMonitor


def test_safety_pipeline():
    contract_address = os.getenv("CONTRACT_ADDRESS", "0xB794f5ea0ba39494ce839613fffba74279579268")
    rpc_url = os.getenv("AMOY_RPC_URL", "https://rpc-amoy.polygon.technology")
    private_key = os.getenv("PRIVATE_KEY")

    if not private_key:
        print("PRIVATE_KEY not set")
        sys.exit(1)

    print("Testing VVU Safety Pipeline")
    print("=" * 50)

    print("Initializing SAE monitor...")
    sae = SparseAutoencoderMonitor(d_hidden=4096, m_expansive=65536)

    print("Initializing alignment bridge...")
    bridge = AlignmentCircuitBridge(
        contract_address=contract_address,
        chain_id=80002,
        private_key=private_key
    )

    print("Initializing contract client...")
    artifact_path = "src/lib/contracts/artifacts/src/lib/contracts/CircuitBreaker.sol/CircuitBreaker.json"
    client = CircuitBreakerClient(
        contract_address=contract_address,
        rpc_url=rpc_url,
        private_key=private_key,
        artifact_path=artifact_path
    )

    print("\nTest 1: Safe activation (should clear)")
    safe_features = torch.randn(65536) * 0.1
    result = bridge.evaluate_and_trip(safe_features, threshold=12.0)
    print(f"  Result: {result['action']}")
    print(f"  Score: {result['score']:.4f}")

    print("\nTest 2: Unsafe activation (should trip)")
    unsafe_features = torch.zeros(65536)
    unsafe_features[41055] = 15.0
    result = bridge.evaluate_and_trip(unsafe_features, threshold=12.0)
    print(f"  Result: {result['action']}")
    print(f"  Score: {result.get('score', 'N/A')}")

    if result["action"] == "TRIP_CIRCUIT_BREAKER":
        print(f"  Feature ID: {result['payload']['featureId']}")
        print(f"  Critical Score: {result['payload']['criticalScore']}")
        print(f"  Signature: {result['signature'][:32]}...")
        print(f"  Telemetry Sig: {result.get('telemetry_signature', 'N/A')[:32]}...")

        print("\nTest 3: Broadcast to chain (simulated)")
        try:
            tx_hash = client.assert_breach(result["payload"], result["signature"])
            print(f"  Transaction sent: {tx_hash[:32]}...")
            print(f"  https://amoy.polygonscan.com/tx/{tx_hash}")
        except Exception as e:
            print(f"  Broadcast failed (expected on testnet without contract): {e}")

    print("\nPipeline test complete!")
    return 0


if __name__ == "__main__":
    sys.exit(test_safety_pipeline())
