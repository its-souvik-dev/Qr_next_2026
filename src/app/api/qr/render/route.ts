import { NextResponse } from "next/server";
import { guardApi, jsonError } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { QrContentError } from "@/lib/qr/matrix";
import { renderQrSvg } from "@/lib/qr/render";
import { rasterizeSvg } from "@/lib/qr/raster";
import { renderRequestSchema } from "@/features/qr/schemas/save";

const MIME = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml" } as const;

/** High-resolution export. Renders the vector QR and rasterizes it server-side with Sharp. */
export async function POST(request: Request) {
  const guard = await guardApi(RATE_LIMITS.render, "render");
  if (guard.response) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }
  const parsed = renderRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid render request", { issues: parsed.error.issues.slice(0, 5) });
  const { content, config, format, size, dpi, transparent, quality } = parsed.data;

  let svg: string;
  try {
    svg = renderQrSvg(content, config, { size, transparent }).svg;
  } catch (error) {
    return jsonError(422, error instanceof QrContentError ? error.message : "Couldn't render this QR code");
  }

  const body2 = format === "svg" ? Buffer.from(svg) : await rasterizeSvg(svg, { size, format, dpi, quality });
  return new NextResponse(new Uint8Array(body2), {
    headers: {
      "Content-Type": MIME[format],
      "Content-Length": String(body2.length),
      "Cache-Control": "no-store",
      "X-Image-Size": `${size}x${size}`,
    },
  });
}
