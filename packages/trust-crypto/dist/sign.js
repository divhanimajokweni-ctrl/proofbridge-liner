#!/usr/bin/env node
// sign.js - Ed25519 signing utility for VVU Trust Chain
// Usage: echo "data" | node sign.js --key <private-key.pem>
//        node sign.js <file> --key <private-key.pem> > <file>.sig

const fs = require('fs');
const crypto = require('crypto');

function usage() {
  console.error('Usage: echo "data" | node sign.js --key <private-key.pem>');
  console.error('       node sign.js <file> --key <private-key.pem> > <file>.sig');
  process.exit(1);
}

function main() {
  const args = process.argv.slice(2);
  let keyPath;
  let inputFile = null;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--key' && i + 1 < args.length) {
      keyPath = args[i + 1];
      i++;
    } else if (args[i].startsWith('--')) {
      usage();
    } else if (!inputFile) {
      inputFile = args[i];
    } else {
      usage();
    }
  }

  if (!keyPath) {
    usage();
  }

  // Read the private key
  let privateKey;
  try {
    const keyData = fs.readFileSync(keyPath, 'utf8');
    privateKey = crypto.createPrivateKey(keyData);
  } catch (err) {
    console.error('Error reading private key:', err.message);
    process.exit(1);
  }

  // Read input
  let data;
  if (inputFile) {
    try {
      data = fs.readFileSync(inputFile);
    } catch (err) {
      console.error('Error reading input file:', err.message);
      process.exit(1);
    }
  } else {
    // Read from stdin
    data = Buffer.concat([
      process.stdin.read() || Buffer.from(''),
      ...(process.stdin.readable ? [process.stdin.read()] : [])
    ]);
    
    // If stdin is empty, read all data
    if (data.length === 0) {
      data = fs.readFileSync(0); // Read from stdin file descriptor
    }
  }

  // Sign the data with Ed25519
  try {
    const signature = crypto.sign(null, data, privateKey);
    process.stdout.write(signature.toString('base64'));
  } catch (err) {
    console.error('Error signing data:', err.message);
    process.exit(1);
  }
}

main();
