import type { Metadata } from "next";
import Link from "next/link";
import { Layers, Link2, Plus, QrCode } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { QrThumb } from "@/components/dashboard/qr-thumb";
import { QrCardActions } from "@/components/dashboard/qr-card-actions";
import { QrFilters } from "@/components/dashboard/qr-filters";
import { requireUser } from "@/lib/auth/dal";
import { formatRelative } from "@/lib/utils";
import { listQrCodes } from "@/features/qr/services/qr-service";
import { QR_TYPES, qrTypeMeta } from "@/features/qr/types";
import type { QRType } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "QR codes" };

const filtersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  type: z.enum(QR_TYPES.map((t) => t.type) as [QRType, ...QRType[]]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
});

export default async function QrCodesPage(props: PageProps<"/qr-codes">) {
  const user = await requireUser();
  const raw = await props.searchParams;
  const filters = filtersSchema.parse(Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
  const { items, total, page, pageCount } = await listQrCodes(user.id, { query: filters.q, type: filters.type, page: filters.page });
  const filtered = Boolean(filters.q || filters.type);

  return (
    <>
      <PageHeader
        title="QR codes"
        description={`${total} saved code${total === 1 ? "" : "s"}. Static codes keep working even if you delete them here.`}
        actions={
          <>
            <Button variant="outline" asChild><Link href="/qr-codes/batch"><Layers /> Batch generate</Link></Button>
            <Button asChild><Link href="/qr-codes/create"><Plus /> Create QR code</Link></Button>
          </>
        }
      />
      <div className="grid gap-5">
        <QrFilters />
        {items.length === 0 ? (
          <EmptyState
            icon={QrCode}
            title={filtered ? "No matching QR codes" : "Your library is empty"}
            description={filtered ? "Try a different search or filter." : "Create a QR code and save it to find it here later."}
            action={!filtered && <Button asChild><Link href="/qr-codes/create"><Plus /> Create QR code</Link></Button>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((qr) => {
              const meta = qrTypeMeta(qr.type);
              return (
                <div key={qr.id} className="group relative rounded-xl border bg-card p-2.5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <Link href={`/qr-codes/${qr.id}`} className="block">
                    <QrThumb id={qr.id} name={qr.name} updatedAt={qr.updatedAt} className="border" />
                    <div className="mt-2.5 px-0.5">
                      <div className="truncate text-sm font-medium">{qr.name}</div>
                      <div className="mt-0.5 flex items-center justify-between gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><meta.icon className="size-3" /> {meta.label}</span>
                        <span>{formatRelative(qr.updatedAt)}</span>
                      </div>
                    </div>
                  </Link>
                  {qr.shortLink && (
                    <Badge variant="secondary" className="absolute top-4 left-4 gap-1 text-[10px] shadow-sm"><Link2 className="size-3" /> /{qr.shortLink.slug}</Badge>
                  )}
                  <div className="absolute top-4 right-4 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                    <QrCardActions id={qr.id} name={qr.name} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} basePath="/qr-codes" params={{ q: filters.q, type: filters.type }} />
      </div>
    </>
  );
}
