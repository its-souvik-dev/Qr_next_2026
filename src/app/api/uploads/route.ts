import { NextResponse } from "next/server";
import sharp, { type Metadata } from "sharp";
import { guardApi, jsonError } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/security/rate-limit";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["png", "jpeg", "webp", "svg"]);
const LIMITS = { logo: 768, background: 1600 } as const;

/**
 * Secure image upload for logos and background images.
 * - Format is detected from the file bytes (not the extension or client MIME type).
 * - SVGs are rasterized, so scripts / external references can never reach the browser.
 * - Everything is re-encoded (metadata stripped) and downscaled before being returned as a data URL.
 * Nothing is written to disk; the sanitized image is embedded in the QR configuration.
 */
export async function POST(request: Request) {
  const guard = await guardApi(RATE_LIMITS.upload, "upload");
  if (guard.response) return guard.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "Expected multipart form data");
  }
  const file = form.get("file");
  const kind = form.get("kind") === "background" ? "background" : "logo";
  if (!(file instanceof File)) return jsonError(400, "No file provided");
  if (file.size === 0) return jsonError(400, "The file is empty");
  if (file.size > MAX_BYTES) return jsonError(413, "Images must be 4 MB or smaller");

  const bytes = Buffer.from(await file.arrayBuffer());
  const head = bytes.subarray(0, 4096).toString("utf8");
  const isSvg = /^\s*</.test(head) && /<svg[\s>]/i.test(head);
  if (isSvg) {
    const text = bytes.toString("utf8");
    if (/<!ENTITY|<!DOCTYPE|xlink:href\s*=\s*["'](?!#|data:)|\bhref\s*=\s*["'](?!#|data:)/i.test(text)) {
      return jsonError(422, "SVGs with external references or entities aren't allowed");
    }
  }

  let meta: Metadata;
  try {
    meta = await sharp(bytes, { limitInputPixels: 50_000_000 }).metadata();
  } catch {
    return jsonError(415, "Unsupported or corrupted image. Use PNG, JPG, SVG or WebP.");
  }
  if (!meta.format || !ALLOWED.has(meta.format)) {
    return jsonError(415, "Unsupported image type. Use PNG, JPG, SVG or WebP.");
  }

  const max = LIMITS[kind];
  try {
    let pipeline = sharp(bytes, { density: meta.format === "svg" ? 300 : undefined, limitInputPixels: 50_000_000 })
      .rotate()
      .resize(max, max, { fit: "inside", withoutEnlargement: meta.format !== "svg" });
    let mime: string;
    let output: Buffer;
    if (kind === "background" && !meta.hasAlpha) {
      output = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      mime = "image/jpeg";
    } else {
      pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
      output = await pipeline.toBuffer();
      mime = "image/png";
    }
    const info = await sharp(output).metadata();
    return NextResponse.json(
      { dataUrl: `data:${mime};base64,${output.toString("base64")}`, width: info.width, height: info.height, bytes: output.length },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return jsonError(422, "Couldn't process this image");
  }
}
