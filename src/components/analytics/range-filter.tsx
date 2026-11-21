"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarRange, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RANGE_PRESETS, type Granularity, type RangePreset } from "@/features/analytics/schemas/range";

export function RangeFilter({ preset, granularity, from, to }: { preset: RangePreset; granularity: Granularity; from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [custom, setCustom] = useState({ from, to });
  const [open, setOpen] = useState(false);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      <Select value={preset} onValueChange={(v) => (v === "custom" ? setOpen(true) : update({ range: v, from: null, to: null, g: null }))}>
        <SelectTrigger size="sm" className="w-40" aria-label="Date range"><SelectValue /></SelectTrigger>
        <SelectContent>
          {RANGE_PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm"><CalendarRange /> {preset === "custom" ? `${from} → ${to}` : "Custom"}</Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="grid w-72 gap-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs text-muted-foreground">From<Input type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} /></label>
            <label className="grid gap-1 text-xs text-muted-foreground">To<Input type="date" value={custom.to} min={custom.from} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} /></label>
          </div>
          <Button size="sm" disabled={!custom.from || !custom.to || custom.from > custom.to} onClick={() => { setOpen(false); update({ range: "custom", from: custom.from, to: custom.to }); }}>
            Apply
          </Button>
        </PopoverContent>
      </Popover>
      <div className="flex rounded-md border p-0.5" role="radiogroup" aria-label="Group by">
        {(["day", "week", "month"] as const).map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={granularity === g}
            onClick={() => update({ g })}
            className={`rounded px-2.5 py-1 text-xs capitalize transition-colors ${granularity === g ? "bg-accent font-medium text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
          >
            {g === "day" ? "Daily" : g === "week" ? "Weekly" : "Monthly"}
          </button>
        ))}
      </div>
    </div>
  );
}
