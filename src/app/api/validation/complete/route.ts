import { NextResponse } from "next/server";
import { shouldAttemptCompletion } from "@/lib/validation/completion";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await shouldAttemptCompletion();

  return NextResponse.json({
    ...result,
    server_time: new Date().toISOString(),
  });
}

export async function GET() {
  const result = await shouldAttemptCompletion();

  return NextResponse.json({
    ...result,
    server_time: new Date().toISOString(),
  });
}
