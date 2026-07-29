import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x770342c49e1F4710E0Eed605dCe41e7f3F7600Eb';

const CONTRACT_ABI = [
    {
        name: 'anchorDecision',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'proofHash', type: 'bytes32' },
            { name: 'verdict', type: 'uint8' },
            { name: 'tauScaled', type: 'uint64' },
        ],
        outputs: [{ name: 'anchorSeq', type: 'uint256' }],
    },
    {
        name: 'usedProofs',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'bytes32' }],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'DecisionAnchored',
        type: 'event',
        inputs: [
            { name: 'proofHash', type: 'bytes32', indexed: true },
            { name: 'verdict', type: 'uint8' },
            { name: 'tauScaled', type: 'uint64' },
            { name: 'anchorSeq', type: 'uint256', indexed: false },
        ],
    },
] as const;

export interface AnchorResult {
    txHash: string;
    blockNumber: number;
    anchorSeq: bigint;
    gasUsed: bigint;
}

export interface AnchorOptions {
    gasLimit?: number;
    retries?: number;
}

export class ProofSubmitter {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contract: ethers.Contract;

    constructor(rpcUrl: string, privateKey: string) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(
            privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
            this.provider
        );
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.wallet);
    }

    async isProofUsed(proofHash: string): Promise<boolean> {
        return await this.contract.usedProofs(proofHash);
    }

    async anchorDecision(
        proofHash: string,
        verdict: number,
        tauScaled: bigint,
        options: AnchorOptions = {}
    ): Promise<AnchorResult> {
        const { gasLimit = 200000, retries = 2 } = options;

        let lastError: Error | null = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const tx = await this.contract.anchorDecision(proofHash, verdict, tauScaled, {
                    gasLimit,
                });

                const receipt = await tx.wait();
                if (!receipt) throw new Error('Transaction receipt not found');

                let anchorSeq = 0n;
                for (const log of receipt.logs) {
                    try {
                        const parsed = this.contract.interface.parseLog(log);
                        if (parsed?.name === 'DecisionAnchored') {
                            anchorSeq = parsed.args.anchorSeq;
                            break;
                        }
                    } catch {
                    }
                }

                return {
                    txHash: receipt.hash,
                    blockNumber: receipt.blockNumber,
                    anchorSeq,
                    gasUsed: receipt.gasUsed,
                };
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`[ProofSubmitter] Attempt ${attempt + 1} failed:`, lastError.message);
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
                }
            }
        }

        throw lastError || new Error('Failed to anchor decision');
    }

    static computeProofHash(proofId: string, documentHash: string, verdict: number): string {
        return ethers.keccak256(
            ethers.solidityPacked(
                ['string', 'string', 'uint8'],
                [proofId, documentHash, verdict]
            )
        );
    }

    static tauFromConfidence(confidence: number): bigint {
        return BigInt(Math.round(Math.min(1, Math.max(0, confidence)) * 1_000_000));
    }
}
