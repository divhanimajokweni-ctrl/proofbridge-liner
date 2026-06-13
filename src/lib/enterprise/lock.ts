const requiredEnv = [
  'NEXT_PUBLIC_APP_REGION',
  'NEXT_PUBLIC_TELEMETRY_SECURE',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

export function lockEnterpriseEnv() {
  const missing = requiredEnv.filter(name => !process.env[name])
  if (missing.length > 0) {
    console.warn(`[ENTERPRISE] Missing required env vars: ${missing.join(', ')}`);
  }
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_TELEMETRY_SECURE === 'false') {
    console.warn('[ENTERPRISE] Telemetry encryption flag warning for non-production');
  }
}
