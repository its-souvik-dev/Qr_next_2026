import "server-only";
import { db, Prisma } from "@/lib/db";
import type { AnalyticsRange, Granularity } from "../schemas/range";

export type TimelinePoint = { date: string; clicks: number; uniques: number };
export type BreakdownItem = { name: string; value: number };

const DIMENSIONS = {
  country: Prisma.raw(`COALESCE(c."country", 'Unknown')`),
  device: Prisma.raw(`c."device"`),
  browser: Prisma.raw(`COALESCE(c."browser", 'Unknown')`),
  os: Prisma.raw(`COALESCE(c."os", 'Unknown')`),
  referrer: Prisma.raw(`COALESCE(c."referrer", 'Direct / none')`),
} as const;
export type Dimension = keyof typeof DIMENSIONS;

function scope(userId: string, range: AnalyticsRange, linkId?: string) {
  return Prisma.sql`FROM "LinkClick" c JOIN "ShortLink" l ON l."id" = c."linkId"
    WHERE l."userId" = ${userId} AND c."createdAt" >= ${range.from} AND c."createdAt" < ${range.to}
    ${linkId ? Prisma.sql`AND l."id" = ${linkId}` : Prisma.empty}`;
}

function bucketStart(date: Date, g: Granularity) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (g === "week") {
    const day = (d.getUTCDay() + 6) % 7; // ISO weeks start on Monday (matches Postgres date_trunc)
    d.setUTCDate(d.getUTCDate() - day);
  } else if (g === "month") {
    d.setUTCDate(1);
  }
  return d;
}

function nextBucket(d: Date, g: Granularity) {
  const n = new Date(d);
  if (g === "day") n.setUTCDate(n.getUTCDate() + 1);
  else if (g === "week") n.setUTCDate(n.getUTCDate() + 7);
  else n.setUTCMonth(n.getUTCMonth() + 1);
  return n;
}

export async function getTimeline(userId: string, range: AnalyticsRange, linkId?: string): Promise<TimelinePoint[]> {
  const rows = await db.$queryRaw<{ bucket: Date; clicks: number; uniques: number }[]>`
    SELECT date_trunc(${range.granularity}::text, c."createdAt") AS bucket,
           count(*)::int AS clicks,
           count(DISTINCT c."visitorHash")::int AS uniques
    ${scope(userId, range, linkId)}
    GROUP BY 1 ORDER BY 1`;
  const byKey = new Map(rows.map((r) => [new Date(r.bucket).toISOString().slice(0, 10), r]));
  const points: TimelinePoint[] = [];
  for (let d = bucketStart(range.from, range.granularity); d < range.to; d = nextBucket(d, range.granularity)) {
    const key = d.toISOString().slice(0, 10);
    const row = byKey.get(key);
    points.push({ date: key, clicks: row?.clicks ?? 0, uniques: row?.uniques ?? 0 });
  }
  return points;
}

export async function getBreakdown(userId: string, range: AnalyticsRange, dimension: Dimension, linkId?: string, limit = 8) {
  return db.$queryRaw<BreakdownItem[]>`
    SELECT ${DIMENSIONS[dimension]} AS name, count(*)::int AS value
    ${scope(userId, range, linkId)}
    GROUP BY 1 ORDER BY 2 DESC LIMIT ${limit}`;
}

export async function getTotals(userId: string, range: AnalyticsRange, linkId?: string) {
  const span = range.to.getTime() - range.from.getTime();
  const previous = { ...range, from: new Date(range.from.getTime() - span), to: range.from };
  const [current, prev] = await Promise.all(
    [range, previous].map(
      (r) => db.$queryRaw<{ clicks: number; uniques: number }[]>`
        SELECT count(*)::int AS clicks, count(DISTINCT c."visitorHash")::int AS uniques ${scope(userId, r, linkId)}`,
    ),
  );
  return { clicks: current![0]?.clicks ?? 0, uniques: current![0]?.uniques ?? 0, previousClicks: prev![0]?.clicks ?? 0 };
}

export async function getPeriodSummary(userId: string, linkId?: string) {
  const [row] = await db.$queryRaw<{ day: number; week: number; month: number }[]>`
    SELECT count(*) FILTER (WHERE c."createdAt" >= now() - interval '1 day')::int AS day,
           count(*) FILTER (WHERE c."createdAt" >= now() - interval '7 days')::int AS week,
           count(*) FILTER (WHERE c."createdAt" >= now() - interval '30 days')::int AS month
    FROM "LinkClick" c JOIN "ShortLink" l ON l."id" = c."linkId"
    WHERE l."userId" = ${userId} AND c."createdAt" >= now() - interval '30 days'
    ${linkId ? Prisma.sql`AND l."id" = ${linkId}` : Prisma.empty}`;
  return row ?? { day: 0, week: 0, month: 0 };
}

export async function getTopLinks(userId: string, range: AnalyticsRange, limit = 8) {
  return db.$queryRaw<{ id: string; slug: string; destinationUrl: string; clicks: number }[]>`
    SELECT l."id", l."slug", l."destinationUrl", count(*)::int AS clicks
    ${scope(userId, range)}
    GROUP BY l."id", l."slug", l."destinationUrl" ORDER BY clicks DESC LIMIT ${limit}`;
}

export async function getAnalyticsReport(userId: string, range: AnalyticsRange, linkId?: string) {
  const [totals, summary, timeline, country, device, browser, os, referrer, topLinks] = await Promise.all([
    getTotals(userId, range, linkId),
    getPeriodSummary(userId, linkId),
    getTimeline(userId, range, linkId),
    getBreakdown(userId, range, "country", linkId),
    getBreakdown(userId, range, "device", linkId),
    getBreakdown(userId, range, "browser", linkId),
    getBreakdown(userId, range, "os", linkId),
    getBreakdown(userId, range, "referrer", linkId),
    linkId ? Promise.resolve([]) : getTopLinks(userId, range),
  ]);
  return { totals, summary, timeline, breakdowns: { country, device, browser, os, referrer }, topLinks };
}
export type AnalyticsReport = Awaited<ReturnType<typeof getAnalyticsReport>>;

export async function getDashboardStats(userId: string) {
  const [qrCount, linkCount, clickAgg] = await Promise.all([
    db.qRCode.count({ where: { userId } }),
    db.shortLink.count({ where: { userId } }),
    db.shortLink.aggregate({ where: { userId }, _sum: { clickCount: true } }),
  ]);
  return { qrCount, linkCount, totalClicks: clickAgg._sum.clickCount ?? 0 };
}

/** Delete clicks older than each owner's retention setting. Safe to run repeatedly. */
export async function purgeExpiredClicks(userId?: string) {
  return db.$executeRaw`
    DELETE FROM "LinkClick" c
    USING "ShortLink" l
    LEFT JOIN "UserSettings" s ON s."userId" = l."userId"
    WHERE c."linkId" = l."id"
      ${userId ? Prisma.sql`AND l."userId" = ${userId}` : Prisma.empty}
      AND c."createdAt" < now() - make_interval(days => COALESCE(s."analyticsRetentionDays", 365))`;
}
