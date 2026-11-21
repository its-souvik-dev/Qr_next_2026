"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TagInput({ value, onChange, suggestions = [], id }: { value: string[]; onChange: (tags: string[]) => void; suggestions?: string[]; id?: string }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const tag = raw.trim().slice(0, 24);
    if (!tag || value.includes(tag) || value.length >= 10) return;
    onChange([...value, tag]);
    setDraft("");
  };
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove tag ${tag}`} className="rounded-sm hover:bg-foreground/10">
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        id={id}
        list={id ? `${id}-suggestions` : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        placeholder={value.length ? "" : "Add tags…"}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {id && (
        <datalist id={`${id}-suggestions`}>
          {suggestions.filter((s) => !value.includes(s)).map((s) => <option key={s} value={s} />)}
        </datalist>
      )}
    </div>
  );
}
