/**
 * ProofBridge Liner — PM2 Ecosystem Configuration
 *
 * Manages background processes for the monetization infrastructure.
 *
 * Usage:
 *   pm2 start ecosystem.config.js              # Start all processes
 *   pm2 start ecosystem.config.js --only proofbridge-whatsapp-daemon
 *   pm2 save && pm2 startup                     # Persist across reboots
 *
 * @see https://pm2.keymetrics.io/
 */

module.exports = {
  apps: [
    // ── WhatsApp Notification Daemon ──────────────────────────────
    {
      name: 'proofbridge-whatsapp-daemon',
      script: './services/whatsapp-notifier.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        UPSTASH_REDIS_REST_URL: '',
        UPSTASH_REDIS_REST_TOKEN: '',
        WHATSAPP_AUTH_DIR: 'auth_store_whatsapp',
        WHATSAPP_HEALTH_PORT: '3001',
        WHATSAPP_ADMIN_PHONES: '',
        SLACK_OPERATIONAL_WEBHOOK_URL: '',
        DISCORD_OPERATIONAL_WEBHOOK_URL: '',
      },
      error_file: './logs/whatsapp-error.log',
      out_file: './logs/whatsapp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      stop_exit_codes: ['SIGTERM'],
    },

    // ── Weekly Metrics Reporter ───────────────────────────────────
    {
      name: 'proofbridge-weekly-reporter',
      script: './scripts/weekly-reporter.js',
      instances: 1,
      autorestart: false, // cron handles scheduling, not restart
      watch: false,
      env: {
        NODE_ENV: 'production',
        UPSTASH_REDIS_REST_URL: '',
        UPSTASH_REDIS_REST_TOKEN: '',
        WHATSAPP_AUTH_DIR: 'auth_store_whatsapp',
        WHATSAPP_ADMIN_PHONES: '',
        SLACK_OPERATIONAL_WEBHOOK_URL: '',
        DISCORD_OPERATIONAL_WEBHOOK_URL: '',
      },
      error_file: './logs/weekly-reporter-error.log',
      out_file: './logs/weekly-reporter-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
