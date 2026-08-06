/**
 * VVU Working Set Audit
 * Estimates pinned token cost per turn for VVU's CLAUDE.md + AGENTS.md + MEMORY.md + skills
 * Source: Doc-2 finding — 27% of total burn was static prefix re-injected every turn
 *         At 10 model turns per user message, 1K tokens pinned = 10K tokens per exchange
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'

const CHARS_PER_TOKEN  = 4     // conservative estimate for en/code mix
const TURNS_PER_MSG    = 10    // model invocations per user message (agentic loop)
const BUDGET_WARN_TOK  = 4_000 // warn if pinned exceeds this per turn
const BUDGET_HARD_TOK  = 8_000 // error if pinned exceeds this per turn

function estimateTokens(content: string): number {
  return Math.ceil(content.length / CHARS_PER_TOKEN)
}

function readSafe(path: string): string {
  try { return readFileSync(path, 'utf8') }
  catch { return '' }
}

interface FileReport {
  file       : string
  chars      : number
  tokens     : number
  tokensX10  : number  // cost per exchange (10 turns)
  status     : 'OK' | 'WARN' | 'ERROR'
}

const PINNED_FILES: string[] = [
  'CLAUDE.md',
  'AGENTS.md',
  'MEMORY.md',
]

// Skills: only description (frontmatter) is pinned; body loaded on demand
function extractSkillDescription(content: string): string {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return ''
  const descMatch = match[1].match(/description:\s*["']?([\s\S]*?)["']?\s*$/)
  return descMatch ? descMatch[1].trim() : ''
}

const reports: FileReport[] = []
let totalPinned = 0

console.log('\n  VVU WORKING SET AUDIT')
console.log('  ───────────────────────────────────────────────────────')
console.log(`  Token estimate: chars ÷ ${CHARS_PER_TOKEN} | Cost per exchange: tokens × ${TURNS_PER_MSG} turns\n`)

// Pinned grounding files
for (const f of PINNED_FILES) {
  const content = readSafe(f)
  if (!content) { console.log(`  ⚠ ${f}: not found`); continue }
  const tokens = estimateTokens(content)
  const per10  = tokens * TURNS_PER_MSG
  totalPinned += tokens
  const status = tokens > 3_000 ? 'ERROR' : tokens > 2_000 ? 'WARN' : 'OK'
  reports.push({ file: f, chars: content.length, tokens, tokensX10: per10, status })
}

// Skill descriptions (pinned in available_skills list)
const skillsDir = 'skills'
try {
  for (const skillName of readdirSync(skillsDir)) {
    const skillPath = join(skillsDir, skillName, 'SKILL.md')
    const content   = readSafe(skillPath)
    if (!content) continue
    const desc    = extractSkillDescription(content)
    const tokens  = estimateTokens(desc)
    const per10   = tokens * TURNS_PER_MSG
    totalPinned  += tokens
    const status  = tokens > 200 ? 'WARN' : 'OK'
    reports.push({ file: `skills/${skillName}/[desc]`, chars: desc.length, tokens, tokensX10: per10, status })
  }
} catch { /* skills dir may not exist */ }

// Print report table
const statusIcon = (s: string) => s === 'OK' ? '✓' : s === 'WARN' ? '⚠' : '✗'
const pad = (s: string, n: number) => s.padEnd(n)

console.log(`  ${pad('FILE', 40)} ${pad('TOKENS', 8)} PER EXCHANGE  STATUS`)
console.log(`  ${'-'.repeat(75)}`)
for (const r of reports) {
  const icon = statusIcon(r.status)
  console.log(`  ${icon} ${pad(r.file, 38)} ${pad(String(r.tokens), 8)} ${pad(String(r.tokensX10), 14)} ${r.status}`)
}

const totalX10 = totalPinned * TURNS_PER_MSG
console.log(`  ${'-'.repeat(75)}`)
console.log(`  TOTAL PINNED: ${totalPinned} tokens | ${totalX10} tokens per exchange`)
console.log(`  Budget   : ${BUDGET_WARN_TOK} tokens warn | ${BUDGET_HARD_TOK} tokens hard limit`)

if (totalPinned > BUDGET_HARD_TOK) {
  console.log(`\n  ✗ HARD LIMIT EXCEEDED: ${totalPinned} > ${BUDGET_HARD_TOK}`)
  console.log(`    Action: Prune CLAUDE.md. Remove low-value lines from MEMORY.md.`)
  console.log(`    Every 100 tokens cut = ${100 * TURNS_PER_MSG} tokens saved per exchange.`)
  process.exit(1)
} else if (totalPinned > BUDGET_WARN_TOK) {
  console.log(`\n  ⚠ BUDGET WARNING: ${totalPinned} tokens — approaching limit`)
  console.log(`    Monitor: run this script after each CLAUDE.md edit.`)
} else {
  console.log(`\n  ✓ Working set within budget (${BUDGET_WARN_TOK} token warn threshold)`)
}

// Stale pointer check
const memContent = readSafe('MEMORY.md')
const pointers   = memContent.match(/: (docs\/[^\n]+|active\/[^\n]+)/g) ?? []
console.log(`\n  MEMORY.md pointers: ${pointers.length} (manually verify these files exist in repo)`)
for (const p of pointers) {
  const path = p.replace(': ', '').trim()
  try { statSync(path); console.log(`  ✓ ${path}`) }
  catch { console.log(`  ⚠ ${path} — pointer exists but file not found (stale or not yet created)`) }
}

console.log('')
