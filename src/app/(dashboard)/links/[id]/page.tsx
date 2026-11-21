import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, ExternalLink, Lock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { QrSvg } from "@/components/qr-generator/qr-svg";
import { AnalyticsReportView } from "@/components/analytics/analytics-report";
import { RangeFilter } from "@/components/analytics/range-filter";
import { LinkStatusBadge } from "@/components/link-shortener/link-status";
import { LinkDetailActions } from "@/components/link-shortener/link-detail-actions";
import { LinkEditPanel } from "@/components/link-shortener/link-edit-panel";
import { requireUser } from "@/lib/auth/dal";
import { DEFAULT_QR_STYLE } from "@/lib/qr/config";
import { formatDate, formatNumber } from "@/lib/utils";
import { shortLinkUrl } from "@/config/site";
import { getLink, listLinkFacets, listVerifiedDomains } from "@/features/links/services/link-service";
import { getAnalyticsReport } from "@/features/analytics/services/analytics-service";
import { parseRange } from "@/features/analytics/schemas/range";

export const metadata: Metadata = { title: "Link details" };

export default async function LinkDetailPage(props: PageProps<"/links/[id]">) {
  const user = await requireUser();
  const [{ id }, search] = await Promise.all([props.params, props.searchParams]);
  const link = await getLink(user.id, id);
  if (!link) notFound();

  const editing = search.edit === "1";
  const range = parseRange(search);
  const [report, facets, domains] = await Promise.all([
    getAnalyticsReport(user.id, range, link.id),
    editing ? listLinkFacets(user.id) : null,
    editing ? listVerifiedDomains(user.id) : [],
  ]);
  const url = shortLinkUrl(link.slug, link.hostname);
  const day = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="grid gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3"><Link href="/links"><ArrowLeft /> My links</Link></Button>
        <div className="grid gap-6 rounded-xl border bg-card p-4 shadow-xs sm:p-6 md:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-mono text-lg font-semibold sm:text-xl">{url.replace(/^https?:\/\//, "")}</h1>
              <CopyButton value={url} showLabel label="Copy" variant="outline" />
              <LinkStatusBadge link={link} />
            </div>
            {link.title && <p className="mt-1 text-sm">{link.title}</p>}
            <a href={link.destinationUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 flex max-w-full items-center gap-1 text-sm break-all text-muted-foreground hover:text-foreground">
              <ExternalLink className="size-3.5 shrink-0" /> {link.destinationUrl}
            </a>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span>Created {formatDate(link.createdAt)}</span>
              <span>{formatNumber(link.clickCount)} all-time clicks</span>
              {link.expiresAt && <span className="flex items-center gap-1"><CalendarClock className="size-3.5" /> Expires {formatDate(link.expiresAt, { dateStyle: "medium", timeStyle: "short" })}</span>}
              {link.hasPassword && <span className="flex items-center gap-1"><Lock className="size-3.5" /> Password protected</span>}
              {link.category && <Badge variant="secondary">{link.category}</Badge>}
              {link.tags.map((t) => <span key={t} className="flex items-center gap-0.5"><Tag className="size-3" />{t}</span>)}
            </div>
            <div className="mt-5"><LinkDetailActions id={link.id} isActive={link.isActive} editing={editing} /></div>
          </div>
          <Link href={`/qr-codes/create?link=${link.id}`} className="group hidden w-36 shrink-0 md:block" title="Create a styled QR code for this link">
            <QrSvg content={url} config={{ ...DEFAULT_QR_STYLE, margin: 2 }} className="overflow-hidden rounded-lg border transition-shadow group-hover:shadow-md" />
            <span className="mt-1.5 block text-center text-xs text-muted-foreground group-hover:text-foreground">Customize QR →</span>
          </Link>
        </div>
      </div>

      {editing && facets && (
        <Card>
          <CardHeader><CardTitle className="text-base">Edit link</CardTitle></CardHeader>
          <CardContent>
            <LinkEditPanel
              linkId={link.id}
              categories={facets.categories}
              tags={facets.tags}
              domains={domains}
              defaults={{
                destinationUrl: link.destinationUrl,
                slug: link.slug,
                title: link.title ?? "",
                category: link.category ?? "",
                tags: link.tags,
                expiresAt: link.expiresAt?.toISOString() ?? null,
                isActive: link.isActive,
                hasPassword: link.hasPassword,
                domainId: link.domainId,
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Analytics</h2>
          <RangeFilter preset={range.preset} granularity={range.granularity} from={day(range.from)} to={day(new Date(range.to.getTime() - 86_400_000))} />
        </div>
        <AnalyticsReportView report={report} range={range} showTopLinks={false} />
      </div>
    </div>
  );
}
