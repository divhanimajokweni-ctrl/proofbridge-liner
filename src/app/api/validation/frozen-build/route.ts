export const dynamic = "force-static";
export const revalidate = 60;

import fs from "node:fs";
import path from "node:path";

export async function GET() {
  try {
    const candidates = [
      path.join(process.cwd(), "VVU-VAL-001", "protocol", "frozen-build.json"),
      path.join(process.cwd(), "validation", "frozen-build.json"),
    ];
    let payload = null;
    for (const file of candidates) {
      if (fs.existsSync(file)) {
        payload = JSON.parse(fs.readFileSync(file, "utf8"));
        break;
      }
    }
    if (!payload) {
      return Response.json({ frozen_build: null }, { status: 404 });
    }
    return Response.json({ frozen_build: payload });
  } catch {
    return Response.json({ frozen_build: null }, { status: 500 });
  }
}
