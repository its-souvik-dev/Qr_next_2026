"use client";

import { useSearchParams } from "next/navigation";
import { Ban, Clock, LinkIcon, ShieldAlert } from "lucide-react";

const REASONS = {
  "not-found": { icon: LinkIcon, title: "Link not found", text: "This short link doesn't exist. Check the address for typos." },
  disabled: { icon: Ban, title: "Link disabled", text: "The owner of this link has turned it off." },
  expired: { icon: Clock, title: "Link expired", text: "This short link has reached its expiration date." },
  blocked: { icon: ShieldAlert, title: "Destination blocked", text: "This link's destination failed our safety checks, so we didn't redirect you." },
} as const;

export function UnavailableMessage() {
  const reason = useSearchParams().get("reason");
  const r = REASONS[(reason ?? "not-found") as keyof typeof REASONS] ?? REASONS["not-found"];
  return (
    <>
      <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl bg-muted">
        <r.icon className="size-5 text-muted-foreground" />
      </div>
      <h1 className="text-lg font-semibold tracking-tight">{r.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
    </>
  );
}
