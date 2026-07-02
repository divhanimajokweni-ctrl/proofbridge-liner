import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LEGACY_SEQUENCE_FILE = '/opt/vvu/data/user_sequence.dat';
const LOCAL_SEQUENCE_FILE = path.join(process.cwd(), 'data', 'user_sequence.dat');

function resolveSequenceFile(): string | null {
  if (fs.existsSync(LEGACY_SEQUENCE_FILE)) return LEGACY_SEQUENCE_FILE;
  if (fs.existsSync(LOCAL_SEQUENCE_FILE)) return LOCAL_SEQUENCE_FILE;
  return null;
}

export async function GET() {
  try {
    const target = resolveSequenceFile();
    if (target) {
      const value = parseInt(fs.readFileSync(target, 'utf8').trim(), 10);
      if (Number.isFinite(value)) {
        return NextResponse.json({ success: true, currentSequenceNumber: value });
      }
    }

    return NextResponse.json({ success: true, currentSequenceNumber: 0 });
  } catch (err) {
    return NextResponse.json(
      { success: false, currentSequenceNumber: 0 },
      { status: 500 }
    );
  }
}
