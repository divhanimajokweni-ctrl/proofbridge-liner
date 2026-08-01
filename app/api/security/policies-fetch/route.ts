import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LEGACY_OPA_PATH = '/opt/vvu/data/policy-rules.json';
const LOCAL_POLICY_PATH = path.join(process.cwd(), 'data', 'policy-rules.json');

type PolicyRule = {
  groupId: string;
  groupName: 'UBUNTU_DJ' | 'UBUNTU_GAMES' | 'SAFESPACE_IDE' | 'SAFEDECK_CORP';
  maxConcurrentSessions: number;
  rateLimitPerMinute: number;
  allowedMethods: string[];
  isEnforced: boolean;
};

const MOCK_RULES: PolicyRule[] = [
  {
    groupId: 'GRP-01',
    groupName: 'UBUNTU_DJ',
    maxConcurrentSessions: 5,
    rateLimitPerMinute: 60,
    allowedMethods: ['AUDIO_COMPILE'],
    isEnforced: true,
  },
  {
    groupId: 'GRP-02',
    groupName: 'UBUNTU_GAMES',
    maxConcurrentSessions: 10,
    rateLimitPerMinute: 120,
    allowedMethods: ['CONTAINER_SPAWN'],
    isEnforced: true,
  },
  {
    groupId: 'GRP-03',
    groupName: 'SAFESPACE_IDE',
    maxConcurrentSessions: 2,
    rateLimitPerMinute: 30,
    allowedMethods: ['CRYPT_SEAL', 'LOG_ROUTE'],
    isEnforced: false,
  },
];

function loadPolicyFile(): { success: boolean; rules: PolicyRule[]; source: string } {
  const candidates = [LEGACY_OPA_PATH, LOCAL_POLICY_PATH];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, 'utf8');
        const parsed = JSON.parse(raw);
        const rules = Array.isArray(parsed) ? parsed : parsed?.community_groups;
        if (Array.isArray(rules)) {
          return { success: true, rules: rules as PolicyRule[], source: candidate };
        }
      } catch {
        // fall through to fallback
      }
    }
  }
  return { success: true, rules: MOCK_RULES, source: 'mock-feed' };
}

export async function GET() {
  try {
    const { rules, source } = loadPolicyFile();
    return NextResponse.json({ success: true, rules, source });
  } catch (error: any) {
    console.error('[policies-fetch] failed:', error.message);
    return NextResponse.json(
      { success: false, error: 'Policy file read transaction dropped.' },
      { status: 500 }
    );
  }
}
