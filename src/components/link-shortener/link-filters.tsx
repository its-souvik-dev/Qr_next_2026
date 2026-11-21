"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LinkFilters({ categories, tags }: { categories: string[]; tags: string[] }) {
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
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => update({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const active = ["q", "status", "category", "tag"].some((k) => params.get(k));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-52 flex-1 sm:max-w-xs">
        {pending ? <Loader2 className="absolute top-2.5 left-2.5 size-4 animate-spin text-muted-foreground" /> : <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />}
        <Input placeholder="Search links…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" aria-label="Search links" />
      </div>
      <Select value={params.get("status") ?? "all"} onValueChange={(v) => update({ status: v === "all" ? null : v })}>
        <SelectTrigger className="w-36" aria-label="Status"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="disabled">Disabled</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
          <SelectItem value="protected">Password protected</SelectItem>
        </SelectContent>
      </Select>
      {categories.length > 0 && (
        <Select value={params.get("category") ?? "all"} onValueChange={(v) => update({ category: v === "all" ? null : v })}>
          <SelectTrigger className="w-40" aria-label="Category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {tags.length > 0 && (
        <Select value={params.get("tag") ?? "all"} onValueChange={(v) => update({ tag: v === "all" ? null : v })}>
          <SelectTrigger className="w-36" aria-label="Tag"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((t) => <SelectItem key={t} value={t}>#{t}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {active && (
        <Button variant="ghost" size="sm" onClick={() => { setQ(""); start(() => router.replace(pathname)); }}>
          <X /> Clear
        </Button>
      )}
    </div>
  );
}
