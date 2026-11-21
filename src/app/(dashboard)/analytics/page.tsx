import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsReportView } from "@/components/analytics/analytics-report";
import { RangeFilter } from "@/components/analytics/range-filter";
import { requireUser } from "@/lib/auth/dal";
import { getAnalyticsReport } from "@/features/analytics/services/analytics-service";
import { parseRange } from "@/features/analytics/schemas/range";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage(props: PageProps<"/analytics">) {
  const user = await requireUser();
  const range = parseRange(await props.searchParams);
  const report = await getAnalyticsReport(user.id, range);
  const day = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Clicks across all your short links. IP addresses are never stored."
        actions={<RangeFilter preset={range.preset} granularity={range.granularity} from={day(range.from)} to={day(new Date(range.to.getTime() - 86_400_000))} />}
      />
      <AnalyticsReportView report={report} range={range} />
    </>
  );
}
