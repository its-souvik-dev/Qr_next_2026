import type { QRStyleConfig } from "@/lib/qr/config";
import { renderQrSvg } from "@/lib/qr/render";
import { cn } from "@/lib/utils";

/**
 * Inline QR rendering for small previews (style tiles, presets, marketing).
 * Works in both Server and Client Components because the renderer is pure.
 * The SVG markup is produced entirely by our renderer from validated config.
 */
export function QrSvg({ content, config, className }: { content: string; config: QRStyleConfig; className?: string }) {
  let svg = "";
  try {
    svg = renderQrSvg(content, config, { responsive: true }).svg;
  } catch {
    return <div className={cn("rounded bg-muted", className)} />;
  }
  return <div className={cn("[&>svg]:block", className)} dangerouslySetInnerHTML={{ __html: svg }} />;
}
