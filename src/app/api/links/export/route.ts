import { guardApi } from "@/lib/api";
import { linkFiltersSchema } from "@/features/links/schemas/link";
import { exportLinks } from "@/features/links/services/link-service";
import { shortLinkUrl } from "@/config/site";

/** Escape a CSV cell and neutralise spreadsheet formula injection. */
function cell(value: unknown) {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET /api/links/export — CSV of the user's links, honouring the same filters as the list. */
export async function GET(request: Request) {
  const guard = await guardApi({ limit: 10, windowMs: 60_000 }, "export");
  if (guard.response) return guard.response;
  const filters = linkFiltersSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const rows = await exportLinks(guard.user.id, { ...filters, page: undefined });
  const header = ["short_url", "slug", "destination_url", "title", "category", "tags", "status", "password_protected", "expires_at", "clicks", "created_at"];
  const now = new Date();
  const lines = rows.map((l) =>
    [
      shortLinkUrl(l.slug, l.hostname),
      l.slug,
      l.destinationUrl,
      l.title,
      l.category,
      l.tags.join("|"),
      !l.isActive ? "disabled" : l.expiresAt && l.expiresAt <= now ? "expired" : "active",
      l.hasPassword ? "yes" : "no",
      l.expiresAt?.toISOString(),
      l.clickCount,
      l.createdAt.toISOString(),
    ].map(cell).join(","),
  );
  const csv = "﻿" + [header.join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="links-${now.toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
