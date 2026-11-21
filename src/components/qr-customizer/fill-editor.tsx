"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Fill } from "@/lib/qr/config";
import { cn } from "@/lib/utils";
import { ColorInput } from "./color-input";
import { SliderField } from "./slider-field";

const MODES = [
  { id: "solid", label: "Solid" },
  { id: "linear", label: "Linear" },
  { id: "radial", label: "Radial" },
] as const;

function firstColor(fill: Fill) {
  return fill.type === "solid" ? fill.color : fill.stops[0]!.color;
}

/** Edits a solid color or a linear/radial gradient with up to four stops. */
export function FillEditor({ value, onChange, label }: { value: Fill; onChange: (fill: Fill) => void; label: string }) {
  function setMode(mode: Fill["type"]) {
    if (mode === value.type) return;
    const base = firstColor(value);
    const stops = value.type === "solid" ? [{ offset: 0, color: base }, { offset: 1, color: "#7c3aed" }] : value.stops;
    if (mode === "solid") onChange({ type: "solid", color: base });
    else if (mode === "linear") onChange({ type: "linear", rotation: 45, stops });
    else onChange({ type: "radial", stops });
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium">{label}</span>
        <div className="flex rounded-md border p-0.5" role="radiogroup" aria-label={`${label} fill type`}>
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={value.type === m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "rounded px-2 py-0.5 text-xs text-muted-foreground transition-colors",
                value.type === m.id && "bg-accent font-medium text-foreground shadow-xs",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {value.type === "solid" ? (
        <ColorInput value={value.color} onChange={(color) => onChange({ type: "solid", color })} label={label} />
      ) : (
        <div className="grid gap-3">
          <div
            className="h-3 rounded-full border"
            style={{
              background: `${value.type === "linear" ? `linear-gradient(90deg` : `radial-gradient(circle`}, ${[...value.stops]
                .sort((a, b) => a.offset - b.offset)
                .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
                .join(", ")})`,
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            {value.stops.map((stop, i) => (
              <div key={i} className="flex items-center gap-1">
                <ColorInput
                  className="flex-1"
                  value={stop.color}
                  label={`Stop ${i + 1}`}
                  onChange={(color) =>
                    onChange({ ...value, stops: value.stops.map((s, j) => (j === i ? { ...s, color } : s)) })
                  }
                />
                {value.stops.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove stop ${i + 1}`}
                    onClick={() => {
                      const stops = value.stops.filter((_, j) => j !== i);
                      onChange({ ...value, stops: stops.map((s, j) => ({ ...s, offset: j / (stops.length - 1) })) });
                    }}
                  >
                    <X />
                  </Button>
                )}
              </div>
            ))}
            {value.stops.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  const stops = [...value.stops, { offset: 1, color: value.stops.at(-1)!.color }];
                  onChange({ ...value, stops: stops.map((s, j) => ({ ...s, offset: j / (stops.length - 1) })) });
                }}
              >
                <Plus /> Stop
              </Button>
            )}
          </div>
          {value.type === "linear" && (
            <SliderField
              label="Angle"
              value={value.rotation}
              min={0}
              max={360}
              format={(v) => `${v}°`}
              onChange={(rotation) => onChange({ ...value, rotation })}
            />
          )}
        </div>
      )}
    </div>
  );
}
