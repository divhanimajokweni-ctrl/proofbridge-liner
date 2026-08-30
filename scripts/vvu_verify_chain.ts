import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const CHRONICLE_LOG_PATH =
  process.env.CHRONICLE_LOG_PATH ||
  '/opt/vvu/data/chronicle_chain.log';

function existsSync(target: string): boolean {
  try {
    return fs.existsSync(target);
  } catch {
    return false;
  }
}

function auditChronicleChain(targetPath: string): void {
  if (!existsSync(targetPath)) {
    console.error(
      `🚨 [AUDIT ABORTED] Chronicle log does not exist: ${targetPath}`
    );
    process.exit(1);
  }

  console.log('🔍 [INITIATING INTEGRITY AUDIT] Scanning ISO 20022 chronicle logs...');

  const logLines = fs
    .readFileSync(targetPath, 'utf8')
    .trim()
    .split('\n');
  let expectedPreviousHash =
    '0000000000000000000000000000000000000000000000000000000000000000';
  let complianceViolationsCount = 0;

  for (let i = 0; i < logLines.length; i++) {
    if (!logLines[i].trim()) continue;

    try {
      const entry = JSON.parse(logLines[i]);
      const header = entry.Document.Hdr;
      const txInfo = entry.Document.TxInf;

      const blockMsgId = header.MsgId;
      const recordPrevHash = header.DocAttest.PrevBlockId;
      const recordChecksum = header.DocAttest.Checksum;

      if (recordPrevHash !== expectedPreviousHash) {
        console.error(
          `\n🚨 [CHAIN FRACTURE DETECTED] Row #${i} (MsgId: ${blockMsgId}) invalid linkage.`
        );
        console.error(
          `   Expected: ${expectedPreviousHash}\n   Found:    ${recordPrevHash}`
        );
        complianceViolationsCount++;
        break;
      }

      const recalculatedChecksum = crypto
        .createHash('sha256')
        .update(JSON.stringify(txInfo) + recordPrevHash)
        .digest('hex');

      if (recalculatedChecksum !== recordChecksum) {
        console.error(
          `\n🚨 [PAYLOAD TAMPERING DETECTED] Row #${i} (MsgId: ${blockMsgId}) checksum mismatch.`
        );
        console.error(
          `   Recalculated: ${recalculatedChecksum}\n   Recorded:    ${recordChecksum}`
        );
        complianceViolationsCount++;
        break;
      }

      expectedPreviousHash = recordChecksum;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `🚨 [CORRUPTED BLOCK STRUCTURE] Row #${i} parse error: ${message}`
      );
      complianceViolationsCount++;
      break;
    }
  }

  if (complianceViolationsCount === 0) {
    console.log(
      `\n💚 [AUDIT VERIFIED]: 100% data integrity across ${logLines.length} blocks.`
    );
    console.log(`   Terminal Chain Hash: ${expectedPreviousHash}`);
    process.exit(0);
  }

  console.error(
    `\nCRITICAL: Chronicle validation failed with ${complianceViolationsCount} breach indicators.`
  );
  process.exit(1);
}

const target = process.argv[2] || CHRONICLE_LOG_PATH;
auditChronicleChain(target);
