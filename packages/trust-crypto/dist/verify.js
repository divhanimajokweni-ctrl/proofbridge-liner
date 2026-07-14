#!/usr/bin/env node
// verify.js - Ed25519 verification utility for VVU Trust Chain
// Usage: node verify.js <file> <signature> --public-key <public-key.pem>
//        echo "data" | node verify.js - <signature> --public-key <public-key.pem>

const fs = require('fs');
const crypto = require('crypto');

function usage() {
  console.error('Usage: node verify.js <file> <signature> --public-key <public-key.pem>');
  console.error('       echo "data" | node verify.js - <signature> --public-key <public-key.pem>');
  process.exit(1);
}

function main() {
  const args = process.argv.slice(2);
  let keyPath;
  let signatureFile = null;
  let inputFile = null;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--public-key' && i + 1 < args.length) {
      keyPath = args[i + 1];
      i++;
    } else if (args[i] === '-') {
      // stdin mode
      inputFile = '-';
    } else if (args[i].startsWith('--')) {
      usage();
    } else if (!inputFile) {
      inputFile = args[i];
    } else if (!signatureFile) {
      signatureFile = args[i];
    } else {
      usage();
    }
  }

  if (!keyPath || !signatureFile) {
    usage();
  }

  // Read the public key
  let publicKey;
  try {
    const keyData = fs.readFileSync(keyPath, 'utf8');
    publicKey = crypto.createPublicKey(keyData);
  } catch (err) {
    console.error('Error reading public key:', err.message);
    process.exit(1);
  }

  // Read the signature
  let signature;
  try {
    const sigData = fs.readFileSync(signatureFile, 'utf8');
    signature = Buffer.from(sigData, 'base64');
  } catch (err) {
    console.error('Error reading signature:', err.message);
    process.exit(1);
  }

  // Read input data
  let data;
  if (inputFile === '-') {
    // Read from stdin
    data = Buffer.concat([
      process.stdin.read() || Buffer.from(''),
      ...(process.stdin.readable ? [process.stdin.read()] : [])
    ]);
    
    if (data.length === 0) {
      data = fs.readFileSync(0);
    }
  } else {
    try {
      data = fs.readFileSync(inputFile);
    } catch (err) {
      console.error('Error reading input file:', err.message);
      process.exit(1);
    }
  }

  // Verify the signature
  try {
    const isValid = crypto.verify(null, data, publicKey, signature);
    
    if (isValid) {
      console.log('✅ Signature is valid');
      process.exit(0);
    } else {
      console.error('❌ Signature is INVALID');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error verifying signature:', err.message);
    process.exit(1);
  }
}

main();
