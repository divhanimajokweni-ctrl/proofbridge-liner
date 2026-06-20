export const CIRCUIT_BREAKER_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'assetId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'expectedHash', type: 'bytes32' },
    ],
    name: 'validate',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'circuitOpen',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'assetId', type: 'bytes32' }],
    name: 'latestProof',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
