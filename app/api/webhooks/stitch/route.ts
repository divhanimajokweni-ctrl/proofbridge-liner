import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set at runtime');
    }
    _redis = new Redis({ url, token });
  }
  return _redis;
}

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
] as const;

interface StitchPaymentEvent {
    type: string;
    id: string;
    data: {
        payment?: {
            id: string;
            amount: { quantity: number; currency: string };
            status: string;
            metadata?: Record<string, string>;
        };
        refund?: {
            id: string;
            amount: { quantity: number; currency: string };
            paymentId: string;
        };
    };
}

function verifyStitchSignature(rawBody: Uint8Array, signature: string, secret: string): boolean {
    if (!secret || !signature) return false;
    const bodyBytes = new Uint8Array(rawBody);
    const expected = createHmac('sha256', secret).update(bodyBytes).digest('hex');
    try {
        const sig = new Uint8Array(Buffer.from(signature, 'hex'));
        const exp = new Uint8Array(Buffer.from(expected, 'hex'));
        return timingSafeEqual(sig, exp);
    } catch {
        return false;
    }
}

async function anchorToCircuitBreaker(
    proofHash: string,
    verdict: number,
    tauScaled: bigint
): Promise<{ txHash: string; blockNumber: number; anchorSeq: bigint }> {
    const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
    const privateKey = process.env.VERIFIER_PRIVATE_KEY;

    if (!rpcUrl) throw new Error('POLYGON_AMOY_RPC_URL not configured');
    if (!privateKey) throw new Error('VERIFIER_PRIVATE_KEY not configured');

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    const tx = await contract.anchorDecision(proofHash, verdict, tauScaled, {
        gasLimit: 200000,
    });

    const receipt = await tx.wait();
    if (!receipt) throw new Error('Transaction receipt not found');

    const anchorSeq = receipt.logs.reduce((acc: bigint, log: any) => {
        try {
            const parsed = contract.interface.parseLog(log);
            if (parsed?.name === 'DecisionAnchored') {
                return parsed.args.anchorSeq;
            }
            return acc;
        } catch {
            return acc;
        }
    }, 0n);

    return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        anchorSeq,
    };
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const rawBody = new Uint8Array(await req.arrayBuffer());

        const secret = process.env.STITCH_WEBHOOK_SECRET;
        if (!secret) {
            console.error('[stitch-webhook] STITCH_WEBHOOK_SECRET not configured');
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        const signatureHeader = req.headers.get('x-stitch-signature') || '';
        const signature = signatureHeader.replace('sha256=', '');

        if (!verifyStitchSignature(rawBody, signature, secret)) {
            console.warn('[stitch-webhook] Signature invalid');
            return NextResponse.json(
                { error: 'Webhook signature verification failed' },
                { status: 401 }
            );
        }

        let event: StitchPaymentEvent;
        try {
            event = JSON.parse(new TextDecoder('utf-8').decode(rawBody));
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON body' },
                { status: 400 }
            );
        }

        const { type, id, data } = event;
        console.info('[stitch-webhook] Verified event:', type, id);

        if (type === 'payment.completed' || type === 'payment.succeeded') {
            const payment = data?.payment;
            if (!payment) {
                return NextResponse.json(
                    { error: 'Missing payment data' },
                    { status: 400 }
                );
            }

            const proofHash = ethers.keccak256(
                ethers.solidityPacked(
                    ['string', 'string', 'uint256'],
                    [payment.id, payment.metadata?.poolId || 'default', payment.amount.quantity]
                )
            );

            const result = await anchorToCircuitBreaker(
                proofHash,
                0,
                BigInt(950000)
            );

            // ── Billing Upgrade — update Upstash Redis client profile ──
            // Extract clientId from payerReference: expects "PB-client-id"
            const payerReference = payment.metadata?.payerReference ||
              `PB-default-client`;
            const clientId = payerReference.replace('PB-', '');

            try {
              // Use domain-separated key (billing:) per HF-4
              await getRedis().hset(`billing:client:${clientId}`, {
                tier: 'Enterprise Core',
                monthlyLimit: '500000',
                updatedAt: Date.now().toString(),
                status: 'ACTIVE',
                paymentProcessor: 'stitch',
                stitchPaymentId: payment.id,
              });

              console.log(
                `[stitch-webhook] Billing upgraded for client: ${clientId}`
              );

              // Fire optional Slack notification
              try {
                const { dispatchSlackNotification } = await import(
                  '../../../../lib/slack-notifier'
                );
                await dispatchSlackNotification({
                  eventType: 'BILLING_UPGRADE',
                  clientId,
                  tierName: 'Enterprise Core',
                  monthlyLimit: 500000,
                });
              } catch {
                // Slack notifier is optional
              }
            } catch (dbErr: any) {
              console.error(
                '[stitch-webhook] Billing upgrade failed:',
                dbErr.message
              );
              // Don't fail the webhook — anchoring already succeeded
            }

            return NextResponse.json({
                received: true,
                eventId: id,
                type,
                paymentId: payment.id,
                txHash: result.txHash,
                blockNumber: result.blockNumber,
                anchorSeq: result.anchorSeq.toString(),
                proofHash,
                status: 'ANCHORED',
                billingUpgraded: true,
            }, { status: 200 });
        }

        return NextResponse.json({
            received: true,
            eventId: id,
            type,
            status: 'ACKNOWLEDGED',
        }, { status: 200 });

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[stitch-webhook] Error:', message);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
