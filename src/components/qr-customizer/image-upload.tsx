"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

export type UploadedImage = { dataUrl: string; width: number; height: number; bytes: number };

const MAX_DIMENSION = { logo: 768, background: 1600 } as const;

/**
 * Sanitize an image entirely in the browser: decode it, downscale and re-encode as PNG.
 * Redrawing through a canvas drops metadata and any SVG scripts. Nothing is uploaded.
 */
async function processLocally(file: File, max: number): Promise<UploadedImage> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } catch {
      throw new Error("Unsupported or corrupted image. Use PNG, JPG, SVG or WebP.");
    }
    const w0 = img.naturalWidth || max;
    const h0 = img.naturalHeight || max;
    const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
    const scale = isSvg ? max / Math.max(w0, h0) : Math.min(1, max / Math.max(w0, h0));
    const width = Math.max(1, Math.round(w0 * scale));
    const height = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/png");
    return { dataUrl, width, height, bytes: Math.round((dataUrl.length * 3) / 4) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Drag-and-drop uploader. Files are sanitized and re-encoded by /api/uploads,
 * or in the browser when `local` is set (public generator — no account, no upload).
 */
export function ImageUpload({
  kind,
  onUploaded,
  label,
  compact,
  local,
}: {
  kind: "logo" | "background";
  onUploaded: (image: UploadedImage) => void;
  label: string;
  compact?: boolean;
  local?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type) && !/\.(png|jpe?g|webp|svg)$/i.test(file.name)) {
      toast.error("Use a PNG, JPG, SVG or WebP image");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Images must be 4 MB or smaller");
      return;
    }
    setBusy(true);
    try {
      if (local) {
        onUploaded(await processLocally(file, MAX_DIMENSION[kind]));
      } else {
        const body = new FormData();
        body.set("file", file);
        body.set("kind", kind);
        const res = await fetch("/api/uploads", { method: "POST", body });
        const json = (await res.json()) as UploadedImage & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        onUploaded(json);
      }
      toast.success(kind === "logo" ? "Logo added" : "Background image added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void upload(e.dataTransfer.files[0]);
      }}
      disabled={busy}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        compact ? "px-3 py-3" : "px-4 py-7",
        dragging && "border-primary bg-primary/5",
      )}
    >
      {busy ? <Loader2 className="size-5 animate-spin" /> : <ImageUp className="size-5" />}
      <span className="font-medium text-foreground">{busy ? "Processing…" : label}</span>
      {!compact && <span className="text-xs">PNG, JPG, SVG or WebP · up to 4 MB · drag & drop</span>}
      <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
    </button>
  );
}
