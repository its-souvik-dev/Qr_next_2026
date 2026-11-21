"use client";

import { useId, useState } from "react";
import { HEX_COLOR } from "@/lib/qr/config";
import { cn } from "@/lib/utils";

/** Native color picker + hex text field. Emits only valid hex colors. */
export function ColorInput({
  value,
  onChange,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    // External value changed (preset, undo…) — reset the draft text.
    setSynced(value);
    setText(value);
  }

  const expand = (v: string) => (v.length === 4 ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}` : v);

  return (
    <div className={cn("flex h-9 items-center gap-2 rounded-md border bg-background px-1.5 shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50", className)}>
      <label htmlFor={id} className="relative size-6 shrink-0 cursor-pointer overflow-hidden rounded border shadow-inner" style={{ background: value }}>
        <span className="sr-only">{label ?? "Pick color"}</span>
        <input
          id={id}
          type="color"
          value={expand(value)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <input
        aria-label={label ? `${label} hex value` : "Hex color"}
        value={text}
        spellCheck={false}
        maxLength={7}
        onChange={(e) => {
          const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
          setText(v);
          if (HEX_COLOR.test(v)) onChange(v.toLowerCase());
        }}
        onBlur={() => setText(value)}
        className="w-full min-w-0 bg-transparent font-mono text-xs uppercase outline-none"
      />
    </div>
  );
}
