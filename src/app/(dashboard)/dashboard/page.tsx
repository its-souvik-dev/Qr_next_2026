import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Link2, MousePointerClick, Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CopyButton } from "@/components/shared/copy-button";
import { StatCard } from "@/components/analytics/stat-card";
import { TimelineChart } from "@/components/analytics/timeline-chart";
import { LinkStatusBadge } from "@/components/link-shortener/link-status";
import { QrThumb } from "@/components/dashboard/qr-thumb";
import { requireUser } from "@/lib/auth/dal";
import { formatNumber, formatRelative, hostnameOf } from "@/lib/utils";
import { shortLinkUrl } from "@/config/site";
import { getDashboardStats, getTimeline } from "@/features/analytics/services/analytics-service";
import { parseRange } from "@/features/analytics/schemas/range";
import { recentQrCodes } from "@/features/qr/services/qr-service";
import { recentLinks } from "@/features/links/services/link-service";
import { qrTypeMeta } from "@/features/qr/types";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const user = await requireUser();
  const range = parseRange({ range: "30d", g: "day" });
  const [stats, qrs, links, timeline] = await Promise.all([
    getDashboardStats(user.id),
    recentQrCodes(user.id, 6),
    recentLinks(user.id, 5),
    getTimeline(user.id, range),
  ]);
  const clicks30 = timeline.reduce((s, p) => s + p.clicks, 0);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Here's what's happening with your QR codes and links."
        actions={
          <>
            <Button variant="outline" asChild><Link href="/links/new"><Link2 /> Shorten link</Link></Button>
            <Button asChild><Link href="/qr-codes/create"><Plus /> Create QR code</Link></Button>
          </>
        }
      />
      <div className="grid gap-4 sm:gap-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="QR codes" value={stats.qrCount} icon={QrCode} hint="Saved in your library" />
          <StatCard label="Short links" value={stats.linkCount} icon={Link2} hint="Across all categories" />
          <StatCard label="Total clicks" value={stats.totalClicks} icon={MousePointerClick} hint={`${formatNumber(clicks30)} in the last 30 days`} />
        </div>

        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Clicks · last 30 days</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/analytics">Full analytics <ArrowRight /></Link></Button>
          </CardHeader>
          <CardContent className="px-2 sm:px-4"><TimelineChart data={timeline} granularity="day" height={220} /></CardContent>
        </Card>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent QR codes</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/qr-codes">View all <ArrowRight /></Link></Button>
            </CardHeader>
            <CardContent>
              {qrs.length === 0 ? (
                <EmptyState icon={QrCode} title="No QR codes yet" description="Design your first static QR code — it'll work forever." action={<Button size="sm" asChild><Link href="/qr-codes/create">Create QR code</Link></Button>} />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {qrs.map((qr) => (
                    <Link key={qr.id} href={`/qr-codes/${qr.id}`} className="group rounded-lg border p-2 transition-all hover:-translate-y-0.5 hover:shadow-sm">
                      <QrThumb id={qr.id} name={qr.name} updatedAt={qr.updatedAt} />
                      <div className="mt-2 truncate text-xs font-medium">{qr.name}</div>
                      <div className="text-[11px] text-muted-foreground">{qrTypeMeta(qr.type).label}</div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent links</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link href="/links">View all <ArrowRight /></Link></Button>
            </CardHeader>
            <CardContent>
              {links.length === 0 ? (
                <EmptyState icon={Link2} title="No short links yet" description="Shorten a URL to start tracking clicks." action={<Button size="sm" asChild><Link href="/links/new">Shorten a link</Link></Button>} />
              ) : (
                <ul className="divide-y">
                  {links.map((l) => {
                    const url = shortLinkUrl(l.slug, l.hostname);
                    return (
                      <li key={l.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <Link href={`/links/${l.id}`} className="truncate font-mono text-[13px] font-medium hover:underline">/{l.slug}</Link>
                            <CopyButton value={url} size="icon-xs" />
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{hostnameOf(l.destinationUrl)} · {formatRelative(l.createdAt)}</div>
                        </div>
                        <LinkStatusBadge link={l} />
                        <span className="w-12 text-right text-sm tabular-nums">{formatNumber(l.clickCount)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
