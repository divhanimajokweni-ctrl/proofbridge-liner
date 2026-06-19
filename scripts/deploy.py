#!/usr/bin/env python3
"""
@file deploy.py
Production-hardened deployment script with EIP-1559 support.
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path
from web3 import Web3
from eth_account import Account


def deploy_circuit_breaker():
    rpc_url = os.getenv("AMOY_RPC_URL", "https://rpc-amoy.polygon.technology")
    private_key = os.getenv("PRIVATE_KEY")
    initial_verifier = os.getenv("AUTHORIZED_VERIFIER")

    if not private_key:
        raise ValueError("PRIVATE_KEY environment variable not set")
    if not initial_verifier:
        raise ValueError("AUTHORIZED_VERIFIER environment variable not set")

    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        raise ConnectionError(f"Failed to connect to RPC at {rpc_url}")

    account = Account.from_key(private_key)

    print(f"Deploying CircuitBreaker on chain {w3.eth.chain_id}")
    print(f"Deployer: {account.address}")
    print(f"Initial verifier: {initial_verifier}")

    artifact_path = Path("src/lib/contracts/artifacts/src/lib/contracts/CircuitBreaker.sol/CircuitBreaker.json")
    if not artifact_path.exists():
        print("Compiling contract...")
        subprocess.run(["npx", "hardhat", "compile"], check=True)

    with open(artifact_path, "r") as f:
        contract_json = json.load(f)

    abi = contract_json["abi"]
    bytecode = contract_json["bytecode"]["object"]

    contract = w3.eth.contract(abi=abi, bytecode=bytecode)

    try:
        fee_history = w3.eth.fee_history(1, 'latest', [25, 50, 75])
        base_fee = fee_history['baseFeePerGas'][-1]
        priority_fee = max(w3.to_wei(25, 'gwei'), int(base_fee * 0.15))
        max_fee = int(base_fee * 1.3) + priority_fee

        tx_params = {
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gas": 3000000,
            "maxFeePerGas": max_fee,
            "maxPriorityFeePerGas": priority_fee,
        }
    except Exception:
        tx_params = {
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gas": 3000000,
            "gasPrice": int(w3.eth.gas_price * 1.2),
        }

    tx = contract.constructor(initial_verifier).build_transaction(tx_params)

    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"Transaction sent: {tx_hash.hex()}")

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    contract_address = receipt.contractAddress

    print(f"CircuitBreaker deployed to: {contract_address}")
    print(f"https://amoy.polygonscan.com/address/{contract_address}")

    deployment_info = {
        "network": "polygon-amoy",
        "chain_id": w3.eth.chain_id,
        "address": contract_address,
        "deployer": account.address,
        "verifier": initial_verifier,
        "tx_hash": tx_hash.hex(),
        "block": receipt.blockNumber,
        "timestamp": time.time(),
    }

    Path("deployments").mkdir(exist_ok=True)
    with open("deployments/amoy.json", "w") as f:
        json.dump(deployment_info, f, indent=2)

    print("Deployment info saved to: deployments/amoy.json")
    return contract_address


if __name__ == "__main__":
    deploy_circuit_breaker()
