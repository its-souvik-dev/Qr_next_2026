"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Download, Eye, Loader2, Save, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { exportPixelSize, useQrStudio, useQrStudioApi } from "@/stores/qr-studio-store";
import { saveQrCodeAction } from "../../actions";
import { useQrPreview } from "../../hooks/use-qr-preview";
import { EXTENSION, downloadBlob, exportQr, slugifyFilename } from "../../services/export-client";
import { qrTypeMeta } from "../../types";
import { ExportDialog } from "./export-dialog";
import { Readability } from "./readability";

export function PreviewPanel() {
  const preview = useQrPreview();
  const style = useQrStudio((s) => s.style);
  const settings = useQrStudio((s) => s.exportSettings);
  const name = useQrStudio((s) => s.name);
  const type = useQrStudio((s) => s.type);
  const id = useQrStudio((s) => s.id);
  const dirty = useQrStudio((s) => s.dirty);
  const publicMode = useQrStudio((s) => s.publicMode);
  const setName = useQrStudio((s) => s.setName);
  const touchAll = useQrStudio((s) => s.touchAll);
  const markSaved = useQrStudio((s) => s.markSaved);
  const store = useQrStudioApi();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, startSaving] = useTransition();
  const [showContent, setShowContent] = useState(false);

  const ready = preview.status === "ready";
  const transparent = style.background.transparent || settings.transparent;

  async function quickDownload() {
    if (preview.status !== "ready") return;
    setDownloading(true);
    try {
      const size = exportPixelSize(settings);
      const blob = await exportQr({ content: preview.encoded, config: style, format: settings.format, size, dpi: settings.dpi, transparent: settings.transparent, quality: settings.quality }, { local: publicMode });
      downloadBlob(blob, `${slugifyFilename(name || qrTypeMeta(type).label)}-${size}.${EXTENSION[settings.format]}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  function save(asNew = false) {
    touchAll();
    const state = store.getState();
    if (preview.status !== "ready") {
      toast.error("Fix the content errors before saving");
      return;
    }
    const finalName = state.name.trim() || `${qrTypeMeta(state.type).label} QR`;
    startSaving(async () => {
      const result = await saveQrCodeAction({
        id: asNew ? undefined : (state.id ?? undefined),
        name: finalName,
        content: state.contents[state.type],
        config: { ...state.style, size: exportPixelSize(state.exportSettings) > 4096 ? 4096 : Math.max(128, exportPixelSize(state.exportSettings)) },
        shortLinkId: state.shortLinkId,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      if (!state.name.trim()) setName(finalName);
      markSaved(result.data.id);
      if (state.id !== result.data.id) {
        // Update the URL without remounting the studio, so tabs and local state are preserved.
        window.history.replaceState(null, "", `/qr-codes/${result.data.id}`);
      }
    });
  }

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className={cn("relative flex aspect-square items-center justify-center p-8 sm:p-10", transparent ? "checkerboard" : "bg-muted/40")}>
          {preview.status === "ready" ? (
            <div
              className="aspect-square w-full max-w-[380px] drop-shadow-sm transition-opacity [&>svg]:block"
              role="img"
              aria-label="QR code preview"
              dangerouslySetInnerHTML={{ __html: preview.result.svg }}
            />
          ) : (
            <div className="flex w-full max-w-[380px] flex-col items-center gap-4 text-center">
              <Skeleton className="aspect-square w-full rounded-lg opacity-60" />
              <p className="absolute max-w-60 text-sm text-muted-foreground">
                {preview.status === "error" ? preview.message : "Enter your content to generate a live QR code"}
              </p>
            </div>
          )}
        </div>
        <div className="grid gap-4 border-t p-4">
          {preview.status === "ready" ? (
            <Readability report={preview.report} version={preview.result.matrix.version} ecc={preview.result.matrix.ecc} />
          ) : (
            <p className="text-xs text-muted-foreground">Readability checks appear once there&apos;s something to encode.</p>
          )}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button onClick={quickDownload} disabled={!ready || downloading}>
              {downloading ? <Loader2 className="animate-spin" /> : <Download />}
              Download {settings.format.toUpperCase()}
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(true)} disabled={!ready} aria-label="Preview export">
              <Eye /> Preview
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid gap-1.5">
          <Label htmlFor="qr-name" className="text-[13px]">Name</Label>
          <Input id="qr-name" placeholder={`${qrTypeMeta(type).label} QR`} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
        </div>
        {publicMode ? (
          <p className="text-xs text-muted-foreground">Used for the file name. Your QR code is generated in your browser — nothing is uploaded or stored.</p>
        ) : (
        <div className="flex gap-2">
          <Button className="flex-1" variant="secondary" onClick={() => save()} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {id ? (dirty ? "Save changes" : "Saved") : "Save to library"}
          </Button>
          {id && (
            <Button variant="outline" onClick={() => save(true)} disabled={saving}>
              Save as new
            </Button>
          )}
        </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4 text-sm shadow-sm">
        <div className="flex items-center gap-2 font-medium">
          <ScanLine className="size-4 text-primary" /> Test before you print
        </div>
        <ul className="mt-2 grid list-disc gap-1 pl-5 text-xs leading-relaxed text-muted-foreground">
          <li>Open your phone camera and point it at the preview above — it should react within a second.</li>
          <li>Try from ~30 cm away and at an angle; test both iOS and Android if you can.</li>
          <li>Printed codes should be at least 2 × 2 cm (0.8 in), larger when scanned from far away.</li>
        </ul>
        {preview.status === "ready" && (
          <div className="mt-3">
            <button type="button" onClick={() => setShowContent((v) => !v)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ChevronDown className={cn("size-3.5 transition-transform", showContent && "rotate-180")} /> Encoded content
            </button>
            {showContent && (
              <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted p-2.5 font-mono text-[11px] break-all whitespace-pre-wrap">{preview.encoded}</pre>
            )}
          </div>
        )}
      </div>

      {preview.status === "ready" && (
        <ExportDialog open={dialogOpen} onOpenChange={setDialogOpen} content={preview.encoded} config={style} settings={settings} name={name} local={publicMode} />
      )}
    </div>
  );
}
