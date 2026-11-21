import { z } from "zod";

export type Granularity = "day" | "week" | "month";
export type AnalyticsRange = { from: Date; to: Date; granularity: Granularity; preset: RangePreset };
export type RangePreset = "7d" | "30d" | "90d" | "12m" | "custom";

export const RANGE_PRESETS: { value: Exclude<RangePreset, "custom">; label: string; days: number }[] = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "12m", label: "Last 12 months", days: 365 },
];

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const searchSchema = z.object({
  range: z.enum(["7d", "30d", "90d", "12m", "custom"]).catch("30d"),
  from: dateString.optional().catch(undefined),
  to: dateString.optional().catch(undefined),
  g: z.enum(["day", "week", "month"]).optional().catch(undefined),
});

const DAY = 86_400_000;

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Parse ?range=&from=&to=&g= into a concrete UTC range. Invalid input falls back to the last 30 days. */
export function parseRange(params: Record<string, string | string[] | undefined>, now = new Date()): AnalyticsRange {
  const flat = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const parsed = searchSchema.parse(flat);
  const tomorrow = new Date(startOfUtcDay(now).getTime() + DAY);

  let from: Date;
  let to = tomorrow;
  let preset: RangePreset = parsed.range;
  if (parsed.range === "custom" && parsed.from && parsed.to) {
    from = new Date(`${parsed.from}T00:00:00Z`);
    to = new Date(new Date(`${parsed.to}T00:00:00Z`).getTime() + DAY);
    if (!(from < to) || to.getTime() - from.getTime() > 3 * 366 * DAY) {
      from = new Date(tomorrow.getTime() - 30 * DAY);
      to = tomorrow;
      preset = "30d";
    }
  } else {
    const days = RANGE_PRESETS.find((p) => p.value === parsed.range)?.days ?? 30;
    from = new Date(tomorrow.getTime() - days * DAY);
    if (preset === "custom") preset = "30d";
  }
  const spanDays = (to.getTime() - from.getTime()) / DAY;
  const granularity: Granularity = parsed.g ?? (spanDays > 180 ? "month" : spanDays > 60 ? "week" : "day");
  return { from, to, granularity, preset };
}
