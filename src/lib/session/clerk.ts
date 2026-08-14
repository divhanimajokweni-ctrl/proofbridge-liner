import { auth, clerkClient } from '@clerk/nextjs/server';

export function isClerkServerConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const sk = process.env.CLERK_SECRET_KEY;
  return !!pk && pk.startsWith('pk_') && !pk.includes('placeholder') && !!sk && sk.startsWith('sk_') && !sk.includes('placeholder');
}

export async function getClerkSession() {
  if (!isClerkServerConfigured()) return null;
  try {
    const session = await auth();
    if (!session?.userId) return null;
    const client = await clerkClient();
    const user = await client.users.getUser(session.userId);
    return { userId: session.userId, sessionId: session.sessionId, metadata: user.publicMetadata as Record<string, unknown>, privateMetadata: user.privateMetadata as Record<string, unknown>, externalAccounts: user.externalAccounts.map((a) => ({ provider: a.provider, providerUserId: a.providerUserId, email: a.emailAddress })) };
  } catch (e) { console.warn('[clerk-session] Failed:', e); return null; }
}

export async function isClerkAuthenticated(): Promise<boolean> { if (!isClerkServerConfigured()) return false; try { return !!(await auth())?.userId; } catch { return false; } }
export async function getClerkUserId(): Promise<string | null> { if (!isClerkServerConfigured()) return null; try { return (await auth())?.userId ?? null; } catch { return null; } }
