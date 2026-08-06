/**
 * Discord Webhook Embed Integration
 *
 * Posts structured, color-coded diagnostic summaries using
 * Discord Embed configuration for circuit-breaker and billing events.
 *
 * @see https://discord.com/developers/docs/resources/webhook
 */

interface DiscordAlertPayload {
  eventType: 'CIRCUIT_BREAKER_TRIPPED' | 'BILLING_UPGRADE';
  agentId?: string;
  targetContract?: string;
  reason?: string;
  valueETH?: number;
  chronicleId?: string;
  clientId?: string;
  tierName?: string;
  monthlyLimit?: number;
}

/**
 * Dispatch a formatted Discord notification using Embed layout.
 * Configure via DISCORD_OPERATIONAL_WEBHOOK_URL environment variable.
 */
export async function dispatchDiscordNotification(
  alert: DiscordAlertPayload
): Promise<void> {
  const webhookUrl = process.env.DISCORD_OPERATIONAL_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn(
      '[discord] DISCORD_OPERATIONAL_WEBHOOK_URL not set. Skipping dispatch.'
    );
    return;
  }

  const isCircuitBreaker =
    alert.eventType === 'CIRCUIT_BREAKER_TRIPPED';

  const embedPayload = {
    embeds: [
      {
        title: isCircuitBreaker
          ? '🚨 PROOFBRIDGE LINER: POLICY ENFORCEMENT'
          : '💰 REVENUE METRIC: SUBSCRIPTION UPGRADE',
        description: isCircuitBreaker
          ? 'The pre-signing gate has isolated an on-chain autonomous transaction runner.'
          : 'Client integration loop complete. Premium ledger quotas updated.',
        color: isCircuitBreaker ? 0xed4245 : 0x2ecc71, // Red or Green
        fields: isCircuitBreaker
          ? [
              {
                name: 'Agent Identifier',
                value: `\`${alert.agentId || 'unknown'}\``,
                inline: true,
              },
              {
                name: 'Intercepted Value',
                value: `\`${alert.valueETH || 0} ETH\``,
                inline: true,
              },
              {
                name: 'Incident Vector',
                value: `\`${alert.reason || 'N/A'}\``,
                inline: false,
              },
              {
                name: 'Chronicle Reference',
                value: `\`${alert.chronicleId || 'N/A'}\``,
                inline: false,
              },
            ]
          : [
              {
                name: 'Client Identifier',
                value: `\`${alert.clientId || 'unknown'}\``,
                inline: true,
              },
              {
                name: 'License Plan Tier',
                value: `**${alert.tierName || 'Unknown'}**`,
                inline: true,
              },
              {
                name: 'Log Allocation Cap',
                value: `\`${(alert.monthlyLimit || 0).toLocaleString()}\` lines`,
                inline: false,
              },
            ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'ProofBridge Gateway Monitoring Node',
        },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embedPayload),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.error(
        `[discord] Webhook rejected payload. Status: ${response.status}`
      );
    }
  } catch (error) {
    console.error('[discord] Communication error:', error);
  }
}
