import { NextResponse } from "next/server";
import { guardApi, jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { parseRange } from "@/features/analytics/schemas/range";
import { getAnalyticsReport } from "@/features/analytics/services/analytics-service";

/** GET /api/analytics?range=30d&g=day[&linkId=...] — aggregated click analytics as JSON. */
export async function GET(request: Request) {
  const guard = await guardApi();
  if (guard.response) return guard.response;
  const params = Object.fromEntries(new URL(request.url).searchParams);
  let linkId: string | undefined;
  if (params.linkId) {
    const link = await db.shortLink.findFirst({ where: { id: params.linkId, userId: guard.user.id }, select: { id: true } });
    if (!link) return jsonError(404, "Link not found");
    linkId = link.id;
  }
  const range = parseRange(params);
  const report = await getAnalyticsReport(guard.user.id, range, linkId);
  return NextResponse.json({ range: { from: range.from, to: range.to, granularity: range.granularity }, ...report }, { headers: { "Cache-Control": "private, no-store" } });
}
