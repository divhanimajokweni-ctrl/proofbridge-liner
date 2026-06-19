import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import CircuitBreakerABI from './abi/CircuitBreaker.json';

const CONTRACT_ADDRESS = process.env.CIRCUIT_BREAKER_ADDRESS;
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;

export async function POST(req: NextRequest) {
    const { proofHash, poolId, amount } = await req.json();

    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CircuitBreakerABI, wallet);

        const tx = await contract.updateProof(proofHash, poolId, amount, {
            gasLimit: 200000,
        });

        const receipt = await tx.wait();

        return NextResponse.json({
            success: true,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const proofHash = searchParams.get('proofHash');

    if (!proofHash) {
        return NextResponse.json(
            { error: 'Missing proofHash' },
            { status: 400 }
        );
    }

    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CircuitBreakerABI, provider);

        const exists = await contract.usedProofs(proofHash);

        return NextResponse.json({
            verified: exists,
            proofHash,
            timestamp: Date.now(),
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
