#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# generate-certs.sh — Self-signed CA, Server, and Client Certificate Generator
#
# Generates a complete PKI hierarchy for mTLS in the VVU Earth Ledger:
#   1. Self-signed CA certificate
#   2. Server certificate signed by the CA
#   3. Client certificate signed by the CA (for mTLS)
#
# Usage:
#   ./generate-certs.sh [OPTIONS]
#
# Options:
#   -d, --days DAYS      Certificate validity period in days (default: 365)
#   -o, --output DIR     Output directory for certs (default: ./certs)
#   -h, --help           Show this help message
#
# Key Rotation Guidance:
#   - Rotate CA certificates every 5 years minimum
#   - Rotate server/client certificates every 90 days
#   - Use short-lived certificates (max 365 days) for production
#   - After rotation, restart all services and verify mTLS handshake
#   - Keep old CA certificates in trust store until all leaf certs are renewed
#   - Monitor certificate expiry with Prometheus alerts (see Observability.md)
#   - For emergency rotation, see docs/KeyRotation.md
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Defaults ────────────────────────────────────────────────────────────────
DAYS=365
OUTPUT_DIR="./certs"
CA_KEY_BITS=4096
SERVER_KEY_BITS=2048
CLIENT_KEY_BITS=2048

# ─── Parse Arguments ─────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--days)
      DAYS="$2"
      shift 2
      ;;
    -o|--output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '2,/^# ──/p' "$0" | sed 's/^# //' | sed 's/^#//'
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

echo "=== VVU Earth Ledger — Certificate Generation ==="
echo "  Validity: ${DAYS} days"
echo "  Output:   ${OUTPUT_DIR}"
echo ""

# ─── Create Output Directory ─────────────────────────────────────────────────
mkdir -p "${OUTPUT_DIR}"
chmod 700 "${OUTPUT_DIR}"

# ─── 1. Generate CA Certificate ──────────────────────────────────────────────
echo "[1/3] Generating CA certificate..."

openssl genrsa -out "${OUTPUT_DIR}/ca.key" ${CA_KEY_BITS} 2>/dev/null
chmod 600 "${OUTPUT_DIR}/ca.key"

openssl req -new -x509 \
  -key "${OUTPUT_DIR}/ca.key" \
  -out "${OUTPUT_DIR}/ca.crt" \
  -days "${DAYS}" \
  -subj "/C=ZA/ST=Gauteng/L=Johannesburg/O=VVU Earth Tech/OU=Certificate Authority/CN=VVU Earth Ledger Root CA" \
  -addext "basicConstraints=critical,CA:TRUE" \
  -addext "keyUsage=critical,keyCertSign,cRLSign" \
  -addext "subjectKeyIdentifier=hash"

chmod 644 "${OUTPUT_DIR}/ca.crt"

echo "  CA certificate: ${OUTPUT_DIR}/ca.crt"
echo "  CA private key: ${OUTPUT_DIR}/ca.key"

# ─── 2. Generate Server Certificate ──────────────────────────────────────────
echo "[2/3] Generating server certificate..."

# Create SAN extension config
SERVER_EXT="${OUTPUT_DIR}/server_ext.cnf"
cat > "${SERVER_EXT}" <<EOF
[req]
distinguished_name = req_dn
req_extensions = v3_req
prompt = no

[req_dn]
C = ZA
ST = Gauteng
L = Johannesburg
O = VVU Earth Tech
OU = Ledger Server
CN = vvu-earth-ledger

[v3_req]
basicConstraints = CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = vvu-earth-ledger
DNS.3 = vvu-earth-ledger.default.svc.cluster.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

openssl genrsa -out "${OUTPUT_DIR}/server.key" ${SERVER_KEY_BITS} 2>/dev/null
chmod 600 "${OUTPUT_DIR}/server.key"

openssl req -new \
  -key "${OUTPUT_DIR}/server.key" \
  -out "${OUTPUT_DIR}/server.csr" \
  -config "${SERVER_EXT}"

openssl x509 -req \
  -in "${OUTPUT_DIR}/server.csr" \
  -CA "${OUTPUT_DIR}/ca.crt" \
  -CAkey "${OUTPUT_DIR}/ca.key" \
  -CAcreateserial \
  -out "${OUTPUT_DIR}/server.crt" \
  -days "${DAYS}" \
  -extfile "${SERVER_EXT}" \
  -extensions v3_req

chmod 644 "${OUTPUT_DIR}/server.crt"
rm -f "${OUTPUT_DIR}/server.csr" "${SERVER_EXT}"

echo "  Server certificate: ${OUTPUT_DIR}/server.crt"
echo "  Server private key: ${OUTPUT_DIR}/server.key"

# ─── 3. Generate Client Certificate (mTLS) ──────────────────────────────────
echo "[3/3] Generating client certificate for mTLS..."

CLIENT_EXT="${OUTPUT_DIR}/client_ext.cnf"
cat > "${CLIENT_EXT}" <<EOF
[req]
distinguished_name = req_dn
req_extensions = v3_req
prompt = no

[req_dn]
C = ZA
ST = Gauteng
L = Johannesburg
O = VVU Earth Tech
OU = Ledger Client
CN = vvu-earth-ledger-client

[v3_req]
basicConstraints = CA:FALSE
keyUsage = critical, digitalSignature
extendedKeyUsage = clientAuth
EOF

openssl genrsa -out "${OUTPUT_DIR}/client.key" ${CLIENT_KEY_BITS} 2>/dev/null
chmod 600 "${OUTPUT_DIR}/client.key"

openssl req -new \
  -key "${OUTPUT_DIR}/client.key" \
  -out "${OUTPUT_DIR}/client.csr" \
  -config "${CLIENT_EXT}"

openssl x509 -req \
  -in "${OUTPUT_DIR}/client.csr" \
  -CA "${OUTPUT_DIR}/ca.crt" \
  -CAkey "${OUTPUT_DIR}/ca.key" \
  -CAcreateserial \
  -out "${OUTPUT_DIR}/client.crt" \
  -days "${DAYS}" \
  -extfile "${CLIENT_EXT}" \
  -extensions v3_req

chmod 644 "${OUTPUT_DIR}/client.crt"
rm -f "${OUTPUT_DIR}/client.csr" "${CLIENT_EXT}"

echo "  Client certificate: ${OUTPUT_DIR}/client.crt"
echo "  Client private key: ${OUTPUT_DIR}/client.key"

# ─── Cleanup ─────────────────────────────────────────────────────────────────
rm -f "${OUTPUT_DIR}/ca.srl"

# ─── Verify ──────────────────────────────────────────────────────────────────
echo ""
echo "=== Verification ==="

echo "  CA certificate details:"
openssl x509 -in "${OUTPUT_DIR}/ca.crt" -noout -subject -dates -issuer

echo "  Server certificate details:"
openssl x509 -in "${OUTPUT_DIR}/server.crt" -noout -subject -dates -issuer

echo "  Client certificate details:"
openssl x509 -in "${OUTPUT_DIR}/client.crt" -noout -subject -dates -issuer

echo ""
echo "  Verifying server cert against CA..."
openssl verify -CAfile "${OUTPUT_DIR}/ca.crt" "${OUTPUT_DIR}/server.crt"

echo "  Verifying client cert against CA..."
openssl verify -CAfile "${OUTPUT_DIR}/ca.crt" "${OUTPUT_DIR}/client.crt"

echo ""
echo "=== Certificate Generation Complete ==="
echo ""
echo "  Files generated in ${OUTPUT_DIR}/:"
echo "    ca.crt      — CA certificate (distribute to all trust stores)"
echo "    ca.key      — CA private key (KEEP SECURE, needed for renewal)"
echo "    server.crt  — Server certificate (use in LEDGER_TLS_CERT_PATH)"
echo "    server.key  — Server private key (use in LEDGER_TLS_KEY_PATH)"
echo "    client.crt  — Client certificate (for mTLS client auth)"
echo "    client.key  — Client private key (for mTLS client auth)"
echo ""
echo "  Key Rotation: See docs/KeyRotation.md for rotation procedures"
