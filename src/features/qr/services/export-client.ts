"use client";

import type { QRStyleConfig } from "@/lib/qr/config";
import { renderQrSvg } from "@/lib/qr/render";

export type ExportRequest = {
  content: string;
  config: QRStyleConfig;
  format: "png" | "jpeg" | "webp" | "svg";
  size: number;
  dpi: number;
  transparent: boolean;
  quality: number;
};

export const EXTENSION = { png: "png", jpeg: "jpg", webp: "webp", svg: "svg" } as const;

/**
 * Produce the final export file. SVG is generated locally; raster formats are rendered by the
 * server with Sharp so large print sizes are crisp and carry DPI metadata.
 */
export async function exportQr(req: ExportRequest): Promise<Blob> {
  if (req.format === "svg") {
    const { svg } = renderQrSvg(req.content, req.config, { size: req.size, transparent: req.transparent });
    return new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svg}`], { type: "image/svg+xml" });
  }
  const res = await fetch("/api/qr/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Export failed (${res.status})`);
  }
  return res.blob();
}

/** Rasterize in the browser via canvas — used for batch exports to avoid hundreds of requests. */
export async function rasterizeInBrowser(
  svg: string,
  size: number,
  mime: "image/png" | "image/jpeg" | "image/webp",
  quality = 0.92,
): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    if (mime === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
    }
    ctx.drawImage(img, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), mime, quality),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugifyFilename(name: string) {
  return name.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "qr-code";
}
