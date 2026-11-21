import "server-only";
import sharp from "sharp";

export type RasterFormat = "png" | "jpeg" | "webp";

/**
 * Rasterize an SVG with Sharp (librsvg). Output is resampled from the vector source at the exact
 * target size, and the DPI is written into the file metadata for print workflows.
 */
export async function rasterizeSvg(
  svg: string,
  opts: { size: number; format: RasterFormat; dpi?: number; quality?: number; background?: string },
): Promise<Buffer> {
  const dpi = opts.dpi ?? 300;
  // Render at a density that yields at least the requested pixel size, then resize precisely.
  const viewBoxSize = Number(/viewBox="0 0 ([\d.]+)/.exec(svg)?.[1] ?? 1000);
  const density = Math.min(2400, Math.max(72, Math.ceil((opts.size / viewBoxSize) * 72 * 1.05)));
  let image = sharp(Buffer.from(svg), { density, limitInputPixels: 8000 * 8000 }).resize(opts.size, opts.size, {
    fit: "fill",
    kernel: "lanczos3",
  });
  if (opts.format === "jpeg") image = image.flatten({ background: opts.background ?? "#ffffff" });
  image = image.withMetadata({ density: dpi });
  const quality = opts.quality ?? 92;
  switch (opts.format) {
    case "png":
      return image.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    case "jpeg":
      return image.jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
    case "webp":
      return image.webp({ quality, alphaQuality: 100, smartSubsample: true }).toBuffer();
  }
}
