import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  hint?: string;
  delta?: { current: number; previous: number };
}) {
  let change: number | null = null;
  if (delta && delta.previous > 0) change = ((delta.current - delta.previous) / delta.previous) * 100;
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        <Icon className="size-4" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatNumber(value)}</span>
        {change !== null && (
          <span className={cn("flex items-center text-xs font-medium", change >= 0 ? "text-success" : "text-destructive")}>
            {change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(change).toFixed(0)}%
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
