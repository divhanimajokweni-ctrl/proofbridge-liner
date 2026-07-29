/**
 * Slack Alert Dispatch Engine
 *
 * Sends rich Block Kit messages for circuit-breaker events
 * and billing upgrades to your team's Slack workspace.
 *
 * @see https://api.slack.com/block-kit
 */

interface SlackCircuitBreakerPayload {
  eventType: 'CIRCUIT_BREAKER_TRIPPED';
  agentId: string;
  targetContract: string;
  reason: string;
  valueETH: number;
  chronicleId: string;
}

interface SlackBillingPayload {
  eventType: 'BILLING_UPGRADE';
  clientId: string;
  tierName: string;
  monthlyLimit: number;
}

type SlackAlertPayload = SlackCircuitBreakerPayload | SlackBillingPayload;

/**
 * Dispatch a formatted Slack notification using Block Kit.
 * Configure via SLACK_OPERATIONAL_WEBHOOK_URL environment variable.
 */
export async function dispatchSlackNotification(
  alert: SlackAlertPayload
): Promise<void> {
  const webhookUrl = process.env.SLACK_OPERATIONAL_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn(
      '[slack] SLACK_OPERATIONAL_WEBHOOK_URL not set. Skipping dispatch.'
    );
    return;
  }

  const blocks = buildBlocks(alert);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      console.error(
        `[slack] Webhook rejected payload. Status: ${response.status}`
      );
    }
  } catch (error) {
    console.error('[slack] Communication error:', error);
  }
}

function buildBlocks(alert: SlackAlertPayload): any[] {
  if (alert.eventType === 'CIRCUIT_BREAKER_TRIPPED') {
    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 PROOFBRIDGE LINER: EMERGENCY HALT 🚨',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'The inline cryptographic pre-signing policy gate has tripped and isolated an autonomous agent execution stream.',
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Agent ID:*\n\`${alert.agentId}\`` },
          {
            type: 'mrkdwn',
            text: `*Intercepted Value:*\n\`${alert.valueETH} ETH\``,
          },
          {
            type: 'mrkdwn',
            text: `*Target Contract:*\n\`${alert.targetContract.substring(0, 16)}...\``,
          },
          {
            type: 'mrkdwn',
            text: `*Chronicle:*\n\`${alert.chronicleId.substring(0, 12)}...\``,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Violation Vector:*\n>_\`${alert.reason}\`_`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!here> | ${new Date().toISOString()}`,
          },
        ],
      },
    ];
  }

  // BILLING_UPGRADE
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '💰 SUBSCRIPTION UPGRADE 💰',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'A client account has processed payment settlement via Stripe / Stitch.',
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Client:*\n\`${alert.clientId}\``,
        },
        {
          type: 'mrkdwn',
          text: `*Tier:*\n*${alert.tierName}*`,
        },
        {
          type: 'mrkdwn',
          text: `*Monthly Cap:*\n\`${alert.monthlyLimit.toLocaleString()}\` records`,
        },
        {
          type: 'mrkdwn',
          text: '*Status:*\n`ACTIVE_SETTLED`',
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Revenue Node | ${new Date().toLocaleTimeString()}`,
        },
      ],
    },
  ];
}
