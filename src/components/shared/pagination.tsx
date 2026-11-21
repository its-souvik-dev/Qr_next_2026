import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({ page, pageCount, basePath, params }: { page: number; pageCount: number; basePath: string; params: Record<string, string | undefined> }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1] && e[0] !== "page"));
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };
  return (
    <nav className="flex items-center justify-between pt-2" aria-label="Pagination">
      <span className="text-sm text-muted-foreground">Page {page} of {pageCount}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild disabled={page <= 1}>
          {page <= 1 ? <span aria-disabled className="pointer-events-none opacity-50"><ChevronLeft /> Previous</span> : <Link href={href(page - 1)}><ChevronLeft /> Previous</Link>}
        </Button>
        <Button variant="outline" size="sm" asChild disabled={page >= pageCount}>
          {page >= pageCount ? <span aria-disabled className="pointer-events-none opacity-50">Next <ChevronRight /></span> : <Link href={href(page + 1)}>Next <ChevronRight /></Link>}
        </Button>
      </div>
    </nav>
  );
}
