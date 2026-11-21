import Link from "next/link";
import { CalendarDays, MousePointerClick, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsReport as Report } from "@/features/analytics/services/analytics-service";
import type { AnalyticsRange } from "@/features/analytics/schemas/range";
import { formatNumber, hostnameOf } from "@/lib/utils";
import { BreakdownList } from "./breakdown-list";
import { DeviceDonut } from "./device-donut";
import { StatCard } from "./stat-card";
import { TimelineChart } from "./timeline-chart";

export function AnalyticsReportView({ report, range, showTopLinks = true }: { report: Report; range: AnalyticsRange; showTopLinks?: boolean }) {
  const { totals, summary, timeline, breakdowns, topLinks } = report;
  return (
    <div className="grid gap-4 sm:gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clicks" value={totals.clicks} icon={MousePointerClick} delta={{ current: totals.clicks, previous: totals.previousClicks }} hint="vs. previous period" />
        <StatCard label="Unique visitors" value={totals.uniques} icon={Users} hint="Approximate, counted per day" />
        <StatCard label="Last 24 hours" value={summary.day} icon={CalendarDays} hint={`${formatNumber(summary.week)} this week`} />
        <StatCard label="Last 30 days" value={summary.month} icon={CalendarDays} hint="Rolling 30-day clicks" />
      </div>

      <Card className="gap-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Click timeline</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-chart-1" /> Clicks</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded border-t border-dashed border-chart-2" /> Unique</span>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-4">
          <TimelineChart data={timeline} granularity={range.granularity} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm font-medium">Countries</CardTitle></CardHeader><CardContent><BreakdownList items={breakdowns.country} kind="country" /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Devices</CardTitle></CardHeader><CardContent><DeviceDonut data={breakdowns.device} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Referrers</CardTitle></CardHeader><CardContent><BreakdownList items={breakdowns.referrer} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Browsers</CardTitle></CardHeader><CardContent><BreakdownList items={breakdowns.browser} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Operating systems</CardTitle></CardHeader><CardContent><BreakdownList items={breakdowns.os} /></CardContent></Card>
        {showTopLinks && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Top links</CardTitle></CardHeader>
            <CardContent>
              {topLinks.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
              ) : (
                <ul className="grid gap-1">
                  {topLinks.map((l) => (
                    <li key={l.id}>
                      <Link href={`/links/${l.id}`} className="flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm hover:bg-accent">
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-xs">/{l.slug}</span>
                          <span className="block truncate text-xs text-muted-foreground">{hostnameOf(l.destinationUrl)}</span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">{formatNumber(l.clicks)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
