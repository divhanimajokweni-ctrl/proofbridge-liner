/**
 * Slack Interactive Actions Endpoint
 *
 * Receives button clicks from Slack Block Kit messages.
 * Supports:
 *   - deactivate_kill_switch: Resets global_shutdown in Redis
 *   - dismiss_agent_flag: Acknowledges incident
 *
 * Slack sends POST with `payload` form-data field containing JSON.
 * Response updates the original message inline via response_url.
 */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawPayload = formData.get('payload') as string;

    if (!rawPayload) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    const payload = JSON.parse(rawPayload);
    const action = payload.actions?.[0];
    if (!action) {
      return NextResponse.json({ error: 'No action found' }, { status: 400 });
    }

    const actionId = action.action_id;
    const clickerName = payload.user?.name || 'unknown';

    let responseMessageText = '';

    if (actionId === 'deactivate_kill_switch') {
      await redis.set('billing:global_shutdown', false);
      responseMessageText = `✅ *Global circuit breaker deactivated by @${clickerName}.*`;
    } else if (actionId === 'dismiss_agent_flag') {
      const targetChronicleId = action.value || 'unknown';
      responseMessageText = `🔓 *Incident \`${targetChronicleId.substring(0, 10)}...\` dismissed by @${clickerName}.*`;
    } else {
      responseMessageText = `⚠️ Unknown action \`${actionId}\` received.`;
    }

    // Replace the original Slack message inline
    const replacementPayload = {
      text: responseMessageText,
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: responseMessageText },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Action processed via Edge Hook: ${new Date().toLocaleTimeString()}`,
            },
          ],
        },
      ],
    };

    if (payload.response_url) {
      await fetch(payload.response_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(replacementPayload),
      });
    }

    return new Response(null, { status: 200 });
  } catch (error: any) {
    console.error('Slack interaction hook failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
