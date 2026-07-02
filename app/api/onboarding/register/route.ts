import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOCAL_TENANT_DIR = path.join(process.cwd(), 'data', 'tenants');

type TenantManifest = {
  tenant_id: string;
  assigned_domain: string;
  provisioned_services: {
    safeliner_licensed: boolean;
    safedeck_storage_bytes: number;
  };
};

function generateTenantId(email: string, requestedDomain?: string): string {
  const seed = `${email}:${requestedDomain || 'default'}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash | 0;
  }
  return `TEN-${Math.abs(hash).toString().padStart(6, '0')}`;
}

function buildMockManifest(email: string, requestedDomain?: string): TenantManifest {
  const tenantId = generateTenantId(email, requestedDomain);
  const domain =
    requestedDomain && requestedDomain.trim().length > 0
      ? requestedDomain.trim()
      : `${email.split('@')[0]}.vvu.io`;

  return {
    tenant_id: tenantId,
    assigned_domain: domain,
    provisioned_services: {
      safeliner_licensed: true,
      safedeck_storage_bytes: 5 * 1024 * 1024 * 1024,
    },
  };
}

export async function POST(request: Request) {
  try {
    const { email, requestedDomain, requestedTier } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const manifest = buildMockManifest(email, requestedDomain);

    try {
      fs.mkdirSync(LOCAL_TENANT_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(LOCAL_TENANT_DIR, `tenant_${manifest.tenant_id}.json`),
        JSON.stringify(manifest, null, 2)
      );
    } catch {
      // non-blocking: workspace persistence is best-effort in this environment
    }

    return NextResponse.json({
      success: true,
      data: {
        manifest,
        tier: requestedTier || 'FREE_STANDARD',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Onboarding pipeline exception.' },
      { status: 500 }
    );
  }
}
