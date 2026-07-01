import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  type ConnectionState,
  type BaileysEventMap,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { CONFIG } from './config';
import { run_agent } from './agent';
import { close_db } from './memory';
import { logger } from './logger';

let sock: any | null = null;
let reconnectAttempts = 0;

const recentlyProcessed = new Set<string>();

function markProcessed(msgId: string): void {
  recentlyProcessed.add(msgId);
  setTimeout(() => recentlyProcessed.delete(msgId), 300_000);
}

function reconnectDelay(): number {
  return Math.min(60_000, 2_000 * Math.pow(2, reconnectAttempts) + Math.random() * 1_000);
}

async function connectWhatsApp(): Promise<void> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { state, saveCreds } = await useMultiFileAuthState(CONFIG.wa_auth_dir);

  sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: [CONFIG.agent_name, 'Chrome', '120.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
    const connection = update.connection;
    const lastDisconnect = update.lastDisconnect;

    if (connection === 'close') {
      const code = lastDisconnect?.error instanceof Boom
        ? (lastDisconnect.error as Boom).output?.statusCode
        : undefined;

      if (code === DisconnectReason.loggedOut) {
        logger.error({ code }, 'WhatsApp session logged out — delete ./data/wa_auth and restart.');
        process.exit(1);
      }

      const delay = reconnectDelay();
      logger.warn(
        { code, attempt: reconnectAttempts, delay_ms: delay },
        'WhatsApp connection closed — reconnecting',
      );
      reconnectAttempts++;
      await new Promise((resolve) => setTimeout(resolve, delay));
      connectWhatsApp();
    } else if (connection === 'open') {
      reconnectAttempts = 0;
      logger.info({ agent: CONFIG.agent_name }, 'WhatsApp transport pipeline established.');
    }
  });

  sock.ev.on(
    'messages.upsert',
    async ({ messages, type }: BaileysEventMap['messages.upsert']) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe || !msg.key.remoteJid) continue;

        const jid = msg.key.remoteJid;
        const msgId = msg.key.id ?? '';
        const text = (msg.message.conversation ?? msg.message.extendedTextMessage?.text ?? '').trim();

        if (!text) continue;

        if (recentlyProcessed.has(msgId)) {
          logger.debug({ jid, msgId }, 'Duplicate message skipped');
          continue;
        }

        markProcessed(msgId);

        if (CONFIG.allowlist.size > 0 && !CONFIG.allowlist.has(jid)) {
          logger.debug({ jid }, 'Non-allowlisted JID skipped');
          continue;
        }

        logger.info({ jid, chars: text.length }, 'Inbound message received');

        try {
          await (sock as any).sendPresenceUpdate('composing', jid);
          const { reply, toolRounds } = await run_agent(jid, text);
          await (sock as any).sendPresenceUpdate('paused', jid);
          await (sock as any).sendMessage(jid, { text: reply }, { quoted: msg });
          logger.info({ jid, chars: reply.length, toolRounds }, 'Reply dispatched');
        } catch (err) {
          logger.error({ jid, err: err instanceof Error ? err.message : String(err) }, 'Agent execution failed');
          try {
            await (sock as any).sendPresenceUpdate('paused', jid);
            await (sock as any).sendMessage(
              jid,
              { text: 'Eish, system encountered an issue. Try again or ping VVU ops.' },
              { quoted: msg },
            );
          } catch {
            // ignore secondary failures
          }
        }
      }
    },
  );
}

process.on('SIGTERM', async () => {
  logger.info({}, 'SIGTERM received — shutting down gracefully...');
  await (sock as any)?.end?.();
  await close_db();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info({}, 'SIGINT received — shutting down gracefully...');
  await (sock as any)?.end?.();
  await close_db();
  process.exit(0);
});

connectWhatsApp().catch(err => {
  logger.fatal({ msg: err instanceof Error ? err.message : String(err) }, 'WhatsApp connection failed');
  process.exit(1);
});
