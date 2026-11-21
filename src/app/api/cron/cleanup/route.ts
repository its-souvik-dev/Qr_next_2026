import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { purgeExpiredClicks } from "@/features/analytics/services/analytics-service";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * Scheduled maintenance (call daily from your scheduler / Vercel Cron):
 * enforces each user's analytics retention and clears expired sessions & reset tokens.
 */
async function handle(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const [clicks, sessions, tokens] = await Promise.all([
    purgeExpiredClicks(),
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.passwordResetToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] } }),
  ]);
  return NextResponse.json({ clicksDeleted: clicks, sessionsDeleted: sessions.count, resetTokensDeleted: tokens.count });
}

export const GET = handle;
export const POST = handle;
