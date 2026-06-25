import * as ed from '@noble/ed25519';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

/**
 * VVU Platform: FROST Public Key Aggregation Verifier
 * Logic: Aggregates individual Ed25519 public key shares and compares 
 * the result against the defined FROST_GROUP_KEY.
 */

async function verifyFrostAggregation() {
    console.log("🔍 Starting FROST Cryptographic Audit...");

    const groupKeyHex = process.env.FROST_GROUP_KEY;
    const shareHexes = [
        process.env.FROST_PUBKEY_1,
        process.env.FROST_PUBKEY_2,
        process.env.FROST_PUBKEY_3,
        process.env.FROST_PUBKEY_4,
        process.env.FROST_PUBKEY_5
    ].filter(Boolean) as string[];

    if (!groupKeyHex || shareHexes.length < 3) {
        console.error("❌ Error: Missing group key or insufficient shares (min 3) in environment.");
        process.exit(1);
    }

    try {
        // In most Schnorr-based FROST implementations on Ed25519, 
        // the group public key is the sum of the public shares 
        // (derived via DKG or Lagrange interpolation).
        
        // Note: This specific verification assumes additive shares 
        // or that shares provided are already weighted.
        
        let aggregatePoint = null;

        for (const hex of shareHexes) {
            const point = ed.ExtendedPoint.fromHex(hex.replace('0x', ''));
            if (aggregatePoint === null) {
                aggregatePoint = point;
            } else {
                aggregatePoint = aggregatePoint.add(point);
            }
        }

        if (!aggregatePoint) throw new Error("Aggregation failed to produce a point.");

        const calculatedGroupKey = aggregatePoint.toHex();
        const expectedGroupKey = groupKeyHex.replace('0x', '').toLowerCase();

        console.log(`📡 Expected Group Key:   ${expectedGroupKey}`);
        console.log(`🧮 Calculated Aggregate: ${calculatedGroupKey}`);

        if (calculatedGroupKey === expectedGroupKey) {
            console.log("✅ SUCCESS: The group key matches the aggregate of individual shares.");
            console.log("🛡️ FROST Quorum Integrity: VERIFIED.");
            process.exit(0);
        } else {
            console.error("❌ CRITICAL: Cryptographic Drift Detected!");
            console.error("The aggregated shares do NOT match the group key. Signatures will fail validation.");
            process.exit(1);
        }
    } catch (error: any) {
        console.error("❌ Verification Error:", error.message);
        process.exit(1);
    }
}

// Ensure the noble-ed25519 library is configured for sync/async use
if (typeof (ed as any).etc.sha512Sync !== 'function') {
    console.warn("⚠️ Warning: Environment requires sha512 implementation for full Ed25519 support.");
}

verifyFrostAggregation().catch(console.error);