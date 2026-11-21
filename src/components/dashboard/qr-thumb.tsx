import { cn } from "@/lib/utils";

/** Thumbnail of a saved QR code, rendered by the owner-only image endpoint and lazy-loaded. */
export function QrThumb({ id, name, updatedAt, className }: { id: string; name: string; updatedAt: Date | string; className?: string }) {
  const v = new Date(updatedAt).getTime();
  return (
    <div className={cn("checkerboard aspect-square overflow-hidden rounded-md", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- authenticated dynamic SVG */}
      <img src={`/api/qr/${id}/image?size=320&v=${v}`} alt={`QR code: ${name}`} loading="lazy" decoding="async" className="size-full object-contain" />
    </div>
  );
}
