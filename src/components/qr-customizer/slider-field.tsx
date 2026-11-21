"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v) => String(v),
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2.5" data-disabled={disabled || undefined}>
      <div className="flex items-center justify-between">
        <Label className="text-[13px]">{label}</Label>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{format(value)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => v !== undefined && onChange(v)}
        aria-label={label}
      />
    </div>
  );
}
