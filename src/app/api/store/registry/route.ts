import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REGISTRY_PATH = join(process.cwd(), "data", "store-registry.json");

interface ModManifest {
  id: string;
  title: string;
  author: string;
  desc: string;
  price: string;
  category: string;
  version: string;
  entryScript: string | null;
  assets: Record<string, unknown>;
  installed: boolean;
  createdAt: string;
}

function loadRegistry(): { mods: ModManifest[] } {
  if (!existsSync(REGISTRY_PATH)) {
    return { mods: [] };
  }
  try {
    const raw = readFileSync(REGISTRY_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { mods: [] };
  }
}

function saveRegistry(data: { mods: ModManifest[] }) {
  writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * GET /api/store/registry
 * Returns the full list of available mods in the store.
 */
export async function GET() {
  const registry = loadRegistry();
  return NextResponse.json(registry);
}

/**
 * POST /api/store/registry
 * Adds a new mod to the registry.
 * Body: a single ModManifest object (JSON).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    const required = ["id", "title", "author", "category"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate id format (no spaces, alphanumeric + dots + underscores + hyphens)
    if (!/^[a-zA-Z0-9._-]+$/.test(body.id)) {
      return NextResponse.json(
        { error: "id must be alphanumeric (dots, hyphens, underscores allowed)" },
        { status: 400 }
      );
    }

    const registry = loadRegistry();

    // Check for duplicate id
    if (registry.mods.find((m) => m.id === body.id)) {
      return NextResponse.json(
        { error: `Mod with id '${body.id}' already exists` },
        { status: 409 }
      );
    }

    const newMod: ModManifest = {
      id: body.id,
      title: body.title,
      author: body.author,
      desc: body.desc,
      price: body.price || "FREE",
      category: body.category,
      version: body.version || "1.0.0",
      entryScript: body.entryScript ?? null,
      assets: body.assets ?? {},
      installed: false,
      createdAt: new Date().toISOString(),
    };

    registry.mods.push(newMod);
    saveRegistry(registry);

    return NextResponse.json(
      { success: true, mod: newMod, totalMods: registry.mods.length },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Failed to add mod: ${message}` },
      { status: 500 }
    );
  }
}
