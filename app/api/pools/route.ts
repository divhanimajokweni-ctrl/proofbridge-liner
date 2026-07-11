import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { savingsPools } from '@/lib/db/schema';

// POST: Create pool
export async function POST(request: Request) {
  const { name, contributionAmountZar, rotationFrequency } = await request.json();

  if (!name || !contributionAmountZar || !rotationFrequency) {
    return NextResponse.json(
      { error: 'Missing fields: name, contributionAmountZar, rotationFrequency' },
      { status: 400 }
    );
  }

  const [pool] = await db.insert(savingsPools)
    .values({
      poolName: name,
      contributionZar: contributionAmountZar,
      cycle: rotationFrequency,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json(pool);
}

// GET: List pools
export async function GET() {
  const pools = await db.select().from(savingsPools);
  return NextResponse.json(pools);
}
