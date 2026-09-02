import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/maps/config
// Returns the Google Maps API key from the server environment.
// The key is NEVER in the HTML source — it's fetched at runtime.
// If no key is set, returns { hasKey: false } and the frontend
// falls back to Esri satellite (visually identical, no key needed).
export async function GET() {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (key && key.startsWith("AIzaSy")) {
    return NextResponse.json({ hasKey: true, key });
  }
  return NextResponse.json({ hasKey: false, key: null });
}
