import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", route: "mint" });
}

export async function POST() {
  return NextResponse.json({ status: "ok", route: "mint" });
}
