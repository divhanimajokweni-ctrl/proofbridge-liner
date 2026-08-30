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

function resolveWritablePolicyPath(): string {
  const workspaceDir = path.join(process.cwd(), 'data');
  try {
    fs.mkdirSync(workspaceDir, { recursive: true });
  } catch {
    // best-effort; fall back to cwd if workspace data dir can't be created
  }
  return LOCAL_POLICY_PATH;
}

function readExistingPolicy(targetPath: string): { community_groups: PolicyRule[] } {
  if (fs.existsSync(targetPath)) {
    return JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  }
  return { community_groups: [] };
}

export async function POST(request: Request) {
  try {
    const { mutatedRule } = await request.json();

    if (!mutatedRule?.groupId || !mutatedRule?.groupName) {
      return NextResponse.json(
        { success: false, error: 'Invalid policy payload.' },
        { status: 400 }
      );
    }

    const targetPath = resolveWritablePolicyPath();
    const currentPolicy = readExistingPolicy(targetPath);

    const rulesIndex = currentPolicy.community_groups.findIndex(
      (p: any) => p.groupId === mutatedRule.groupId
    );

    const normalisedRule: PolicyRule = {
      groupId: mutatedRule.groupId,
      groupName: mutatedRule.groupName,
      maxConcurrentSessions:
        typeof mutatedRule.maxConcurrentSessions === 'number'
          ? mutatedRule.maxConcurrentSessions
          : 0,
      rateLimitPerMinute:
        typeof mutatedRule.rateLimitPerMinute === 'number'
          ? mutatedRule.rateLimitPerMinute
          : 0,
      allowedMethods: Array.isArray(mutatedRule.allowedMethods)
        ? mutatedRule.allowedMethods
        : [],
      isEnforced: Boolean(mutatedRule.isEnforced),
    };

    if (rulesIndex > -1) {
      currentPolicy.community_groups[rulesIndex] = normalisedRule;
    } else {
      currentPolicy.community_groups.push(normalisedRule);
    }

    fs.writeFileSync(targetPath, JSON.stringify(currentPolicy, null, 2));

    return NextResponse.json({
      success: true,
      source: targetPath,
      rule: normalisedRule,
    });
  } catch (error: any) {
    console.error('[policies-update] failed:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to persist structural rule variations.' },
      { status: 500 }
    );
  }
}
