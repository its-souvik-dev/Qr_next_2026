"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QR_TYPES } from "@/features/qr/types";

export function QrFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => update({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-52 flex-1 sm:max-w-xs">
        {pending ? <Loader2 className="absolute top-2.5 left-2.5 size-4 animate-spin text-muted-foreground" /> : <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />}
        <Input placeholder="Search by name or content…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search QR codes" />
      </div>
      <Select value={params.get("type") ?? "all"} onValueChange={(v) => update({ type: v === "all" ? null : v })}>
        <SelectTrigger className="w-40" aria-label="Filter by type"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {QR_TYPES.map((t) => <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
