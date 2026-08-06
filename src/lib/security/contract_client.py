"""
@file contract_client.py
Hardened EIP-1559 execution client for broadcasting circuit breaker payloads.
Fixes: #1 (paths), #3 (EIP-1559), #4 (error handling), #8 (env config)
"""

import os
import json
import time
from typing import Dict, Any, Optional

from web3 import Web3
from eth_account import Account
import logging

logger = logging.getLogger(__name__)


class CircuitBreakerClient:
    def __init__(
        self,
        contract_address: str,
        rpc_url: str,
        private_key: str,
        artifact_path: Optional[str] = None
    ):
        # Fix #8: Environment validation
        if not private_key or private_key.startswith("your_"):
            raise ValueError("PRIVATE_KEY must be set securely via environment variables")
        if not contract_address.startswith("0x"):
            raise ValueError("CONTRACT_ADDRESS must be a valid Ethereum address")

        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to RPC at {rpc_url}")

        self.account = Account.from_key(private_key)
        self.contract_address = Web3.to_checksum_address(contract_address)

        # Fix #1: Unified artifact path resolution
        if artifact_path is None:
            artifact_path = "src/lib/contracts/artifacts/src/lib/contracts/CircuitBreaker.sol/CircuitBreaker.json"

        self.abi = self._load_contract_abi(artifact_path)
        self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.abi)

    def _load_contract_abi(self, path: str) -> list:
        """Fix #4: Comprehensive error handling on initialization paths."""
        try:
            possible_paths = [
                path,
                path.replace("artifacts/src/lib/contracts", "out"),
                path.replace("artifacts/src/lib/contracts", "artifacts")
            ]

            for p in possible_paths:
                if os.path.exists(p):
                    with open(p, "r") as f:
                        artifact = json.load(f)
                        if isinstance(artifact, dict) and "abi" in artifact:
                            return artifact["abi"]
                        elif isinstance(artifact, list):
                            return artifact
                        else:
                            logger.warning(f"Unexpected artifact format in {p}, trying next path")
                    break
            else:
                raise FileNotFoundError(f"No contract artifact found in any expected path: {possible_paths}")

        except FileNotFoundError as e:
            raise RuntimeError(
                f"Contract artifact not found. Run 'forge build' or 'npx hardhat compile' first. Error: {e}"
            )
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Invalid JSON in contract artifact: {e}")
        except KeyError:
            raise RuntimeError("Contract artifact missing 'abi' field")

    def _get_eip1559_gas_params(self) -> dict:
        """Fix #3: Dynamic Type-2 (EIP-1559) gas execution configurations."""
        try:
            fee_history = self.w3.eth.fee_history(1, 'latest', [25, 50, 75])
            base_fee = fee_history['baseFeePerGas'][-1]
            priority_fee = max(self.w3.to_wei(25, 'gwei'), int(base_fee * 0.15))
            max_fee = int(base_fee * 1.3) + priority_fee
            return {
                'maxFeePerGas': max_fee,
                'maxPriorityFeePerGas': priority_fee
            }
        except Exception as e:
            logger.warning(f"EIP-1559 fee estimation failed, falling back to legacy: {e}")
            fallback_gas_price = self.w3.eth.gas_price
            return {
                'gasPrice': int(fallback_gas_price * 1.2)
            }

    def assert_breach(self, bridge_payload: dict, signature: str) -> str:
        """
        Executes on-chain breaker interventions.
        Fix #2: Clean data pass-through prevents double scaling corruption.
        """
        feature_id = bridge_payload["featureId"]
        critical_score_scaled = bridge_payload["criticalScore"]
        timestamp = bridge_payload["timestamp"]

        gas_params = self._get_eip1559_gas_params()

        try:
            tx = self.contract.functions.assertAlignmentBreach(
                feature_id,
                critical_score_scaled,
                timestamp,
                self.w3.to_bytes(hexstr=signature)
            ).build_transaction({
                "from": self.account.address,
                "nonce": self.w3.eth.get_transaction_count(self.account.address),
                "gas": 250000,
                **gas_params
            })

            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)

            logger.info(f"Circuit breaker transaction sent: {tx_hash.hex()}")
            return tx_hash.hex()

        except Exception as e:
            logger.error(f"Failed to send circuit breaker transaction: {e}")
            raise

    def get_authorized_verifier(self) -> str:
        return self.contract.functions.authorizedVerifier().call()

    def is_paused(self) -> bool:
        return self.contract.functions.isPaused().call()
