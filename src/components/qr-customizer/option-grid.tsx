"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Option<T extends string> = { value: T; label: string; preview?: ReactNode };

/** Visual radio group of tiles. */
export function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  label,
  columns = 3,
}: {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  columns?: 2 | 3 | 4 | 5;
}) {
  const cols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-3 sm:grid-cols-5" }[columns];
  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-2", cols)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "group flex flex-col items-center gap-1.5 rounded-lg border bg-card p-2 text-center text-[11px] text-muted-foreground transition-all hover:border-foreground/20 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              selected && "border-primary text-foreground ring-1 ring-primary",
            )}
          >
            {o.preview && <span className="flex aspect-square w-full items-center justify-center">{o.preview}</span>}
            <span className="w-full truncate leading-tight">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
