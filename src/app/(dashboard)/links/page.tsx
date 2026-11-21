import type { Metadata } from "next";
import Link from "next/link";
import { Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { LinkFilters } from "@/components/link-shortener/link-filters";
import { LinksTable } from "@/components/link-shortener/links-table";
import { requireUser } from "@/lib/auth/dal";
import { linkFiltersSchema } from "@/features/links/schemas/link";
import { listLinkFacets, listLinks } from "@/features/links/services/link-service";

export const metadata: Metadata = { title: "My links" };

export default async function LinksPage(props: PageProps<"/links">) {
  const user = await requireUser();
  const raw = await props.searchParams;
  const filters = linkFiltersSchema.parse(Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
  const [{ items, total, page, pageCount }, facets] = await Promise.all([listLinks(user.id, filters), listLinkFacets(user.id)]);
  const filtered = Boolean(filters.q || filters.category || filters.tag || (filters.status && filters.status !== "all"));

  return (
    <>
      <PageHeader
        title="My links"
        description={`${total} short link${total === 1 ? "" : "s"}${filtered ? " match your filters" : ""}.`}
        actions={<Button asChild><Link href="/links/new"><Plus /> New short link</Link></Button>}
      />
      <div className="grid gap-4">
        <LinkFilters categories={facets.categories} tags={facets.tags} />
        {items.length === 0 ? (
          <EmptyState
            icon={Link2}
            title={filtered ? "No links match" : "No short links yet"}
            description={filtered ? "Try different filters." : "Shorten a long URL to share it anywhere and track every click."}
            action={!filtered && <Button asChild><Link href="/links/new"><Plus /> Shorten a link</Link></Button>}
          />
        ) : (
          <LinksTable
            links={items.map((l) => ({
              ...l,
              expiresAt: l.expiresAt?.toISOString() ?? null,
              createdAt: l.createdAt.toISOString(),
            }))}
          />
        )}
        <Pagination page={page} pageCount={pageCount} basePath="/links" params={{ q: filters.q, status: filters.status, category: filters.category, tag: filters.tag }} />
      </div>
    </>
  );
}
