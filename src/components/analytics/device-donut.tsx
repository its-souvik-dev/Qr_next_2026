"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function DeviceDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>;
  return (
    <div className="flex items-center gap-6">
      <div className="size-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid flex-1 gap-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 capitalize">{d.name}</span>
            <span className="tabular-nums text-muted-foreground">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
