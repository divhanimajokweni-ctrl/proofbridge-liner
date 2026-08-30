#!/usr/bin/env python3
"""Generate an ED25519 SSH keypair in OpenSSH format for use as a GitHub deploy key."""
import os
import sys
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

KEY_DIR = "/home/z/my-project/.deploy-keys"
COMMENT = "vvu-deploy@proofbridge-liner"

os.makedirs(KEY_DIR, mode=0o700, exist_ok=True)
priv_path = os.path.join(KEY_DIR, "id_ed25519")
pub_path = os.path.join(KEY_DIR, "id_ed25519.pub")

if os.path.exists(priv_path):
    print(f"!! key already exists at {priv_path}", file=sys.stderr)
    sys.exit(1)

key = Ed25519PrivateKey.generate()

priv_pem = key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.OpenSSH,
    encryption_algorithm=serialization.NoEncryption(),
)
pub_line = key.public_key().public_bytes(
    encoding=serialization.Encoding.OpenSSH,
    format=serialization.PublicFormat.OpenSSH,
).decode("ascii")

with open(priv_path, "w") as f:
    f.write(priv_pem.decode("ascii"))
os.chmod(priv_path, 0o600)

with open(pub_path, "w") as f:
    f.write(pub_line + " " + COMMENT + "\n")
os.chmod(pub_path, 0o644)

print("=== PUBLIC KEY ===")
print(pub_line + " " + COMMENT)
print()
print("=== fingerprint ===")
# Compute SHA256 fingerprint
import base64, hashlib
blob = base64.b64decode(pub_line.split()[1])
fp = hashlib.sha256(blob).digest()
fp_b64 = base64.b64encode(fp).decode("ascii").rstrip("=")
print(f"SHA256:{fp_b64}")
print()
print(f"=== private key: {priv_path} (mode 0600) ===")
print(f"=== public  key: {pub_path} ===")
