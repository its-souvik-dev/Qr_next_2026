import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApi, jsonError } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { renderQrSvg } from "@/lib/qr/render";
import { rasterizeSvg } from "@/lib/qr/raster";
import { getQrForRender } from "@/features/qr/services/qr-service";

const querySchema = z.object({
  format: z.enum(["svg", "png", "jpeg", "webp"]).default("svg"),
  size: z.coerce.number().int().min(64).max(4096).optional(),
  download: z.enum(["0", "1"]).default("0"),
});
const MIME = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml" } as const;

/** Image of a saved QR code (used for list thumbnails and quick downloads). Owner only. */
export async function GET(request: Request, ctx: RouteContext<"/api/qr/[id]/image">) {
  const guard = await guardApi(RATE_LIMITS.render, "image");
  if (guard.response) return guard.response;
  const { id } = await ctx.params;
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return jsonError(400, "Invalid query");

  const qr = await getQrForRender(guard.user.id, id);
  if (!qr) return jsonError(404, "Not found");

  const { format, download } = query.data;
  const size = query.data.size ?? qr.config.size;
  const svg = renderQrSvg(qr.content, qr.config, { size }).svg;
  const data = format === "svg" ? Buffer.from(svg) : await rasterizeSvg(svg, { size, format });
  const filename = `${qr.name.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") || "qr-code"}.${format === "jpeg" ? "jpg" : format}`;
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME[format],
      "Cache-Control": "private, max-age=60",
      "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'",
      ...(download === "1" ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
    },
  });
}
