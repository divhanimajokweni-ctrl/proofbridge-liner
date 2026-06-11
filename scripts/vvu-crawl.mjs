import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { printCliSummary, runVvuCrawler } from '../src/lib/vvu-crawler/index.js';

function readArg(flag, fallback) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return fallback;
  }

  return process.argv[index + 1] ?? fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function main() {
  const keyword = readArg('--keyword', 'solar inverter');
  const outputPath = readArg('--output', './demo/vvu-crawl-result.json');
  const jsonOnly = hasFlag('--json');
  const maxResults = Number.parseInt(readArg('--max-results', '24'), 10);

  const result = await runVvuCrawler({
    keyword,
    maxResults: Number.isFinite(maxResults) ? maxResults : 24,
  });

  const absoluteOutputPath = resolve(process.cwd(), outputPath);
  await mkdir(dirname(absoluteOutputPath), { recursive: true });
  await writeFile(absoluteOutputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

  if (jsonOnly) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${printCliSummary(result)}\n`);
  process.stdout.write(`\nSaved report to ${absoluteOutputPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`VVU crawler failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
