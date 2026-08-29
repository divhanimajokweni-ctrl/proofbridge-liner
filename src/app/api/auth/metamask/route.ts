import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { address, signature, challenge, chainId } = await req.json();
    if (!address || !signature || !challenge) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    let user;
    try { user = await db.user.findFirst({ where: { email: `${address.toLowerCase()}@metamask.vvu` } }); } catch { return NextResponse.json({ success: true, address, chainId, provider: "metamask" }); }
    if (!user) { try { user = await db.user.create({ data: { email: `${address.toLowerCase()}@metamask.vvu`, name: `Wallet ${address.slice(0, 8)}...${address.slice(-4)}`, password: "metamask-no-password" } }); } catch { return NextResponse.json({ error: "Create failed" }, { status: 500 }); } }
    return NextResponse.json({ success: true, userId: user.id, address, chainId, provider: "metamask" });
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}
