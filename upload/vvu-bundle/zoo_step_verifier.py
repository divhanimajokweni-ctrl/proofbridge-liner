#!/usr/bin/env python3
"""
zoo_step_verifier.py - v0.3
Bridges Zoo-generated STEP files to VVU-IVE On-Chain Ledger
Enforces Zero-Fabrication Rule
"""

import os
import time
import hashlib
from pathlib import Path
from web3 import Web3

ZOO_STEP_CACHE_DIR = Path("./step_cache")
PRIVATE_KEY = os.getenv("WALLET_PRIVATE_KEY")
RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("LEDGER_CONTRACT_ADDRESS")

LEDGER_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "_fileHash", "type": "string"},
            {"internalType": "string", "name": "_source", "type": "string"},
            {"internalType": "uint256", "name": "_timestamp", "type": "uint256"}
        ],
        "name": "registerEvidence",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

def compute_sha256(file_path: Path) -> str:
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return None

def initialize_web3():
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        raise ConnectionError("Failed to connect to RPC")
    account = w3.eth.account.from_key(PRIVATE_KEY)
    w3.eth.default_account = account.address
    print(f"✅ Connected to {RPC_URL} as {account.address}")
    return w3

def submit_to_ledger(w3, file_hash: str, source: str = "Zoo_API"):
    if not CONTRACT_ADDRESS:
        raise ValueError("CONTRACT_ADDRESS not set")
    contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=LEDGER_ABI)
    tx = contract.functions.registerEvidence(file_hash, source, int(time.time())).build_transaction({
        'from': w3.eth.default_account,
        'nonce': w3.eth.get_transaction_count(w3.eth.default_account),
        'gas': 200000,
        'gasPrice': w3.eth.gas_price,
    })
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"⛓ Transaction Sent: {tx_hash.hex()}")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt['status'] == 1:
        print(f"✅ Anchored on-chain")
        return tx_hash.hex()
    else:
        print(f"❌ Failed")
        return None

def watch_and_verify():
    print("👁 Starting Zoo Step Verifier Watcher v0.3...")
    processed_files = set()
    if not ZOO_STEP_CACHE_DIR.exists():
        ZOO_STEP_CACHE_DIR.mkdir(parents=True)
    w3 = initialize_web3()
    while True:
        step_files = list(ZOO_STEP_CACHE_DIR.glob("*.step")) + list(ZOO_STEP_CACHE_DIR.glob("*.stp"))
        for step_file in step_files:
            if step_file.name not in processed_files:
                print(f"🆕 New file: {step_file.name}")
                file_hash = compute_sha256(step_file)
                if not file_hash:
                    continue
                print(f"🔐 Hash: {file_hash[:16]}...")
                try:
                    tx_hash = submit_to_ledger(w3, file_hash, source="Zoo_API_Generation")
                    if tx_hash:
                        processed_files.add(step_file.name)
                except Exception as e:
                    print(f"⚠ Error: {e}")
        time.sleep(2)

if __name__ == "__main__":
    try:
        watch_and_verify()
    except KeyboardInterrupt:
        print("\n🛑 Stopped.")
