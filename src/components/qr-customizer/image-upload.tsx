"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

export type UploadedImage = { dataUrl: string; width: number; height: number; bytes: number };

/** Drag-and-drop uploader. Files are sanitized and re-encoded by /api/uploads. */
export function ImageUpload({
  kind,
  onUploaded,
  label,
  compact,
}: {
  kind: "logo" | "background";
  onUploaded: (image: UploadedImage) => void;
  label: string;
  compact?: boolean;
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
      const body = new FormData();
      body.set("file", file);
      body.set("kind", kind);
      const res = await fetch("/api/uploads", { method: "POST", body });
      const json = (await res.json()) as UploadedImage & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onUploaded(json);
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
