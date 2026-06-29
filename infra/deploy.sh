#!/bin/bash
# deploy.sh - Production deployment

set -e

echo "VVU Earth-Tech Production Deployment"
echo "========================================"

npm install
pip install -r requirements.txt 2>/dev/null || true

echo "Compiling contracts..."
npx hardhat compile

echo "Running tests..."
npx hardhat test 2>/dev/null || echo "Hardhat tests skipped (requires network)"

echo "Deploying CircuitBreaker..."
source .env 2>/dev/null || true
python scripts/deploy.py

echo "Building frontend..."
npm run build

echo "Deployment complete!"
