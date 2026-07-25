import fs from "node:fs";
import path from "node:path";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const hourRoot = path.join(process.cwd(), "VVU-VAL-001", "evidence", ctx.params.id);
  if (!fs.existsSync(hourRoot)) {
    return new Response("Not Found", { status: 404 });
  }
  const files = fs.readdirSync(hourRoot).sort();
  return Response.json({ hour: ctx.params.id, files });
}
