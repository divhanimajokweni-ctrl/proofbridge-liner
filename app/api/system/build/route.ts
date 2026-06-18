import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function readGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown'
  }
}

export async function GET() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || readGitCommit()
  const built = process.env.BUILD_TIME || process.env.VERCEL_GIT_COMMIT_REF || new Date().toISOString()
  const region = process.env.VERCEL_REGION || process.env.AWS_REGION || 'local'
  const version = process.env.NEXT_PUBLIC_APP_VERSION || process.env.npm_package_version || 'prod'
  const signature = crypto.createHash('sha256').update(`${commit}:${built}:${region}:${version}`).digest('hex').slice(0, 12)

  return NextResponse.json({ version, commit, built, region, signature })
}
