"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Granularity } from "@/features/analytics/schemas/range";

type Point = { date: string; clicks: number; uniques: number };

function formatTick(date: string, g: Granularity) {
  const d = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat("en", g === "month" ? { month: "short", year: "2-digit", timeZone: "UTC" } : { month: "short", day: "numeric", timeZone: "UTC" }).format(d);
}

export function TimelineChart({ data, granularity, height = 280 }: { data: Point[]; granularity: Granularity; height?: number }) {
  const empty = data.every((d) => d.clicks === 0);
  return (
    <div className="relative" style={{ height }}>
      {empty && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted-foreground">No clicks in this period yet</div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="fill-clicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(d: string) => formatTick(d, granularity)}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" }}
            labelFormatter={(d) => formatTick(String(d), granularity === "month" ? "month" : "day")}
          />
          <Area type="monotone" dataKey="clicks" name="Clicks" stroke="var(--chart-1)" strokeWidth={2} fill="url(#fill-clicks)" />
          <Area type="monotone" dataKey="uniques" name="Unique visitors" stroke="var(--chart-2)" strokeWidth={1.5} strokeDasharray="4 3" fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
