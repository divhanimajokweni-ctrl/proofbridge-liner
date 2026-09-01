// supabase/functions/paystack-webhook/index.ts
// =============================================================================
// VVU PAYSTACK WEBHOOK HANDLER · RELEASE 20260901
// =============================================================================
// Receives Paystack charge.success webhooks, verifies the HMAC SHA512
// signature, upgrades the user's tier in user_profiles, and writes an
// audit_log entry. Idempotent — safe against duplicate deliveries.
//
// Deploy:
//   supabase functions deploy paystack-webhook --project-ref YOUR_PROJECT_REF
//
// Required env vars (set in Supabase Dashboard > Settings > Env Vars):
//   PAYSTACK_SECRET_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ─── ENVIRONMENT VARIABLES ──────────────────────────────────────────────
const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!PAYSTACK_SECRET || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
    throw new Error("Missing required environment variables: PAYSTACK_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
}

// ─── TIER PRICE MAP (in kobo — R1 = 100 kobo) ──────────────────────────
const TIER_PRICES: Record<string, number> = {
    pro: 35000,        // R350.00
    max: 80000,        // R800.00
    enterprise: 150000 // R1,500.00
};

// ─── CORS HEADERS ──────────────────────────────────────────────────────
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-paystack-signature",
};

// ─── CONSTANT-TIME STRING COMPARE (timing-attack safe) ─────────────────
function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

// ─── HMAC SHA512 SIGNATURE VERIFICATION ────────────────────────────────
async function verifyPaystackSignature(body: string, signature: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(PAYSTACK_SECRET);
    const messageData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    return constantTimeEqual(signature, expectedSignature);
}

serve(async (req) => {
    // ─── 1. Handle CORS Preflight ─────────────────────────────────────
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    // ─── 2. Extract Signature & Body ──────────────────────────────────
    const signature = req.headers.get("x-paystack-signature");
    const body = await req.text();

    if (!signature) {
        return new Response(
            JSON.stringify({ error: "Missing signature header" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // ─── 3. Verify Paystack Signature (HMAC SHA512) ──────────────────
    const isValid = await verifyPaystackSignature(body, signature);
    if (!isValid) {
        console.error("❌ Invalid signature received");
        return new Response(
            JSON.stringify({ error: "Invalid signature" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // ─── 4. Parse Payload ─────────────────────────────────────────────
    let event: any;
    try {
        event = JSON.parse(body);
    } catch (e) {
        console.error("❌ Invalid JSON payload:", e);
        return new Response(
            JSON.stringify({ error: "Invalid JSON" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // ─── 5. Handle Only charge.success Events ─────────────────────────
    if (event.event !== "charge.success") {
        console.log(`ℹ️ Ignoring event: ${event.event}`);
        return new Response(
            JSON.stringify({ message: "Ignored event" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const data = event.data;

    // ─── 6. Extract Metadata ──────────────────────────────────────────
    const metadata = data.metadata || {};
    const userId = metadata.userId;
    const requestedTier = metadata.tier || "pro";
    const paymentRef = data.reference;
    const amount = data.amount;
    const email = data.customer?.email;

    if (!userId) {
        console.error("❌ Missing userId in metadata");
        return new Response(
            JSON.stringify({ error: "Missing userId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // ─── 7. Validate Tier is Allowed ──────────────────────────────────
    if (!TIER_PRICES[requestedTier]) {
        console.error(`❌ Invalid tier: ${requestedTier}`);
        return new Response(
            JSON.stringify({ error: "Invalid tier" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // ─── 8. Verify the amount matches the tier price ─────────────────
    if (amount !== TIER_PRICES[requestedTier]) {
        console.error(`❌ Amount mismatch: expected ${TIER_PRICES[requestedTier]}, got ${amount}`);
        return new Response(
            JSON.stringify({ error: "Amount mismatch" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // ─── 9. Idempotency check: has this reference already been processed? ──
    try {
        const existingEvent = await fetch(
            `${SUPABASE_URL}/rest/v1/payment_events?reference=eq.${paymentRef}&select=id`,
            {
                headers: {
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
            }
        );
        const existingRows = await existingEvent.json();
        if (existingRows && existingRows.length > 0) {
            console.log(`ℹ️ Duplicate webhook for ref ${paymentRef} — already processed, skipping.`);
            return new Response(
                JSON.stringify({ status: "ok", message: "Duplicate — already processed" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
    } catch (e) {
        // Non-fatal: if the check fails, continue with the upgrade (worst case = double-write)
        console.warn("⚠ Idempotency check failed (continuing):", e);
    }

    // ─── 10. Update Supabase User Profile (upgrade tier) ──────────────
    console.log(`🔄 Upgrading user ${userId} to ${requestedTier} (Ref: ${paymentRef})`);

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}`,
            {
                method: "PATCH",
                headers: {
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                body: JSON.stringify({
                    tier: requestedTier,
                    updated_at: new Date().toISOString(),
                    payment_reference: paymentRef,
                    payment_amount: amount,
                    payment_email: email
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Supabase update failed:", errorText);
            throw new Error(`Supabase error: ${response.status}`);
        }

        console.log(`✅ User ${userId} upgraded to ${requestedTier}`);

        // ─── 11. Create payment_events row (audit trail) ──────────────
        await fetch(`${SUPABASE_URL}/rest/v1/payment_events`, {
            method: "POST",
            headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: userId,
                event_type: "charge.success",
                tier: requestedTier,
                amount: amount,
                reference: paymentRef,
                status: "completed",
                processed_at: new Date().toISOString(),
                metadata: { email, raw_payload: data },
            }),
        });

        // ─── 12. Create audit_log entry ──────────────────────────────
        await fetch(`${SUPABASE_URL}/rest/v1/audit_log`, {
            method: "POST",
            headers: {
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: userId,
                action: "tier_upgrade",
                table_name: "user_profiles",
                record_id: userId,
                new_data: {
                    tier: requestedTier,
                    payment_reference: paymentRef,
                    amount: amount,
                    email: email,
                }
            }),
        });

        // ─── 13. Return Success ───────────────────────────────────────
        return new Response(
            JSON.stringify({
                status: "success",
                message: `User ${userId} upgraded to ${requestedTier}`,
                tier: requestedTier,
                reference: paymentRef
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("❌ Upgrade failed:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", message: (error as Error).message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
