import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";

/** GET /api/auth/session — the signed-in user (or null). Useful for API clients and health checks. */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user }, { headers: { "Cache-Control": "private, no-store" } });
}
