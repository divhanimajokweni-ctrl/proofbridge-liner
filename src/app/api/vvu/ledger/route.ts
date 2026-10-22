import { NextResponse } from "next/server";
import { turso, isTurso } from "@/lib/turso";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const source = url.searchParams.get("source");

  try {
    if (isTurso) {
      let sql = "SELECT * FROM WormEvent";
      const args: any[] = [];
      if (source) {
        sql += " WHERE source = ?";
        args.push(source);
      }
      sql += " ORDER BY createdAt DESC LIMIT ?";
      args.push(limit);
      const rows = await turso.execute({ sql, args });
      const countResult = await turso.execute("SELECT COUNT(*) as count FROM WormEvent");
      return NextResponse.json({ events: rows.rows, total: countResult.rows[0] });
    } else {
      const where = source ? { source } : {};
      const [events, total] = await Promise.all([
        db.wormEvent.findMany({ where, take: limit, orderBy: { createdAt: "desc" } }),
        db.wormEvent.count({ where }),
      ]);
      return NextResponse.json({ events, total });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST handler — telemetry service flushes WORM events here
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { source, event, details } = body;

    if (!event) {
      return NextResponse.json({ error: "missing event field" }, { status: 400 });
    }

    // Build the WORM entry
    const entry: any = {
      source: source || "telemetry-service",
      event: event,
      details: typeof details === "string" ? details : JSON.stringify(details ?? {}),
    };

    if (isTurso) {
      const result = await turso.execute({
        sql: "INSERT INTO WormEvent (source, event, details, createdAt) VALUES (?, ?, ?, ?)",
        args: [entry.source, entry.event, entry.details, new Date().toISOString()],
      });
      return NextResponse.json({ ok: true, id: result.lastInsertRowid });
    } else {
      // Generate a SHA-256 hash chain link
      const prev = await db.wormEvent.findFirst({
        orderBy: { seq: "desc" },
        select: { hash: true, seq: true },
      });

      const prevHash = prev?.hash ?? "GENESIS-20260901";
      const seq = (prev?.seq ?? 0) + 1;
      const payload = `${prevHash}|${seq}|${entry.source}|${entry.event}|${entry.details}`;

      // Use Web Crypto API for SHA-256
      const enc = new TextEncoder().encode(payload);
      const digest = await crypto.subtle.digest("SHA-256", enc);
      const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const created = await db.wormEvent.create({
        data: {
          source: entry.source,
          event: entry.event,
          details: entry.details,
          hash,
          prevHash,
          seq,
        },
      });

      return NextResponse.json({ ok: true, id: created.id, seq, hash: hash.slice(0, 16) + "…" });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
