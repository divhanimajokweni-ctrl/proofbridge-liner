import { NextResponse } from "next/server";
async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}
