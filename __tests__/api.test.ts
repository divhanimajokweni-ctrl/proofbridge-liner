import { GET as healthHandler } from '../app/api/health/route';
import { POST as verifyHandler } from '../app/api/verify/route';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => body,
    }),
  },
}));

function createRequest(overrides: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  ip?: string;
}) {
  return {
    ip: overrides.ip || '127.0.0.1',
    headers: {
      get: (name: string) => {
        if (overrides.headers) {
          return overrides.headers[name] || null;
        }
        return null;
      },
    },
    json: async () => {
      if (overrides.body) {
        return JSON.parse(overrides.body);
      }
      return {};
    },
  };
}

describe('VVU Gateway Core API Infrastructure Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.KERNEL_SECRET = 'secure_test_kernel_token_2026';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('Health Route must output structural status metrics with 200 OK', async () => {
    const res = await healthHandler();
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(data.systems.proofbridgeLiner).toBe('online');
  });

  test('Verify Route must throw 401 Unauthorized if KERNEL_SECRET token is absent', async () => {
    const req: any = createRequest({ method: 'POST', body: JSON.stringify({ documentHash: '0xabc123' }) });

    const res = await verifyHandler(req);
    expect(res.status).toBe(401);
    
    const data = await res.json();
    expect(data.error).toContain('Unauthorized');
  });

  test('Verify Route must accept valid schemas when verified with correct credentials', async () => {
    const req: any = createRequest({
      method: 'POST',
      headers: {
        'Authorization': 'Bearer secure_test_kernel_token_2026',
      },
      body: JSON.stringify({
        documentHash: '0x74657374646f63756d656e746861736830303030303030303030303030303032',
        signals: { complianceValid: 1, amountLimit: 5000 },
      }),
    });

    const res = await verifyHandler(req);
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.attestation).toBe('verified');
    expect(data.circuitState).toBe('SOFTWARE-ATTESTED');
  });

  test('Verify Route must reject malformed documentHash with 400', async () => {
    const req: any = createRequest({
      method: 'POST',
      headers: {
        'Authorization': 'Bearer secure_test_kernel_token_2026',
      },
      body: JSON.stringify({ documentHash: '0xshort' }),
    });

    const res = await verifyHandler(req);
    expect(res.status).toBe(400);
  });
});
