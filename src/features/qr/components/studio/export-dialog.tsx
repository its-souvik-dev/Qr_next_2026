"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBytes } from "@/lib/utils";
import type { QRStyleConfig } from "@/lib/qr/config";
import { exportPixelSize, type ExportSettings } from "@/stores/qr-studio-store";
import { EXTENSION, downloadBlob, exportQr, slugifyFilename } from "../../services/export-client";

/** Generates the actual export file and shows it before download. */
export function ExportDialog({
  open,
  onOpenChange,
  content,
  config,
  settings,
  name,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  config: QRStyleConfig;
  settings: ExportSettings;
  name: string;
}) {
  const size = exportPixelSize(settings);
  const request = useMemo(
    () => ({ content, config, format: settings.format, size, dpi: settings.dpi, transparent: settings.transparent, quality: settings.quality }),
    [content, config, settings, size],
  );
  const [result, setResult] = useState<{ request: typeof request; blob?: Blob; url?: string; error?: string } | null>(null);
  const state =
    result && result.request === request
      ? result.error
        ? ({ status: "error", error: result.error } as const)
        : ({ status: "ready", blob: result.blob, url: result.url } as const)
      : ({ status: "loading" } as const);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let url: string | undefined;
    exportQr(request)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setResult({ request, blob, url });
      })
      .catch((error: Error) => !cancelled && setResult({ request, error: error.message }));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, request]);

  const filename = `${slugifyFilename(name || "qr-code")}-${size}.${EXTENSION[settings.format]}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export preview</DialogTitle>
          <DialogDescription>
            This is the exact file you&apos;ll download — {settings.format.toUpperCase()}, {size}×{size}px
            {settings.unit !== "px" && ` (${settings.physical}${settings.unit} at ${settings.dpi} DPI)`}
            {settings.transparent && ", transparent background"}.
          </DialogDescription>
        </DialogHeader>
        <div className="checkerboard flex aspect-square items-center justify-center overflow-hidden rounded-lg border p-6">
          {state.status === "loading" && <Loader2 className="size-6 animate-spin text-muted-foreground" />}
          {state.status === "error" && <p className="text-sm text-destructive">{state.error}</p>}
          {state.status === "ready" && state.url && (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img src={state.url} alt="Exported QR code" className="max-h-full max-w-full object-contain shadow-sm" />
          )}
        </div>
        <DialogFooter className="items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {state.blob ? `${filename} · ${formatBytes(state.blob.size)}` : "Generating…"}
          </span>
          <Button
            disabled={state.status !== "ready"}
            onClick={() => {
              if (!state.blob) return;
              downloadBlob(state.blob, filename);
              toast.success("Download started");
              onOpenChange(false);
            }}
          >
            <Download /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
