"use client";

import { useMemo, useState, useTransition } from "react";
import JSZip from "jszip";
import { FileUp, Loader2, PackageOpen, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrSvg } from "@/components/qr-generator/qr-svg";
import { FormField } from "@/components/shared/form-field";
import { DEFAULT_QR_STYLE, type QRStyleConfig } from "@/lib/qr/config";
import { QR_PRESETS } from "@/lib/qr/presets";
import { renderQrSvg } from "@/lib/qr/render";
import { saveBatchAction } from "../actions";
import { downloadBlob, rasterizeInBrowser, slugifyFilename } from "../services/export-client";
import type { SavedStyle } from "./studio/presets-panel";

type Row = { name: string; value: string };

/** Parse "name,content" or just "content" per line (CSV-friendly, quoted values supported). */
function parseRows(text: string): Row[] {
  const rows: Row[] = [];
  for (const [i, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line) continue;
    const match = /^(?:"((?:[^"]|"")*)"|([^,]*)),(.+)$/.exec(line);
    if (match && !/^https?:\/\//i.test(line)) {
      rows.push({ name: (match[1] ?? match[2] ?? "").replace(/""/g, '"').trim() || `QR ${i + 1}`, value: match[3]!.trim().replace(/^"|"$/g, "") });
    } else {
      rows.push({ name: `QR ${rows.length + 1}`, value: line });
    }
  }
  return rows;
}

export function BatchGenerator({ templates }: { templates: SavedStyle[] }) {
  const [text, setText] = useState("");
  const [styleId, setStyleId] = useState("default");
  const [format, setFormat] = useState<"svg" | "png" | "jpeg">("png");
  const [size, setSize] = useState(1024);
  const [progress, setProgress] = useState<number | null>(null);
  const [saving, startSaving] = useTransition();

  const rows = useMemo(() => parseRows(text), [text]);
  const style: QRStyleConfig = useMemo(() => {
    if (styleId === "default") return DEFAULT_QR_STYLE;
    return QR_PRESETS.find((p) => p.id === styleId)?.config ?? templates.find((t) => t.id === styleId)?.config ?? DEFAULT_QR_STYLE;
  }, [styleId, templates]);
  const invalid = useMemo(() => rows.filter((r) => { try { renderQrSvg(r.value, style); return false; } catch { return true; } }), [rows, style]);

  async function generateZip() {
    if (!rows.length) return;
    setProgress(0);
    try {
      const zip = new JSZip();
      const used = new Map<string, number>();
      for (const [i, row] of rows.entries()) {
        let base = slugifyFilename(row.name);
        const n = used.get(base) ?? 0;
        used.set(base, n + 1);
        if (n) base = `${base}-${n + 1}`;
        const { svg } = renderQrSvg(row.value, style, { size });
        if (format === "svg") zip.file(`${base}.svg`, svg);
        else zip.file(`${base}.${format === "jpeg" ? "jpg" : "png"}`, await rasterizeInBrowser(svg, size, format === "png" ? "image/png" : "image/jpeg"));
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }
      downloadBlob(await zip.generateAsync({ type: "blob" }), `qr-codes-${rows.length}.zip`);
      toast.success(`Generated ${rows.length} QR codes`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Batch export failed");
    } finally {
      setProgress(null);
    }
  }

  function saveAll() {
    startSaving(async () => {
      const res = await saveBatchAction({ rows, config: style });
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-5 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
        <FormField
          label="Rows"
          htmlFor="batch-rows"
          hint={<>One code per line — <code className="font-mono">name,content</code> or just <code className="font-mono">content</code>. URLs and plain text are both supported. Max 500.</>}
          action={
            <label className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <FileUp className="size-3.5" /> Import CSV
              <input type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); e.target.value = ""; }} />
            </label>
          }
        >
          <Textarea id="batch-rows" rows={12} className="font-mono text-xs" placeholder={"Table 1,https://restaurant.example/menu?table=1\nTable 2,https://restaurant.example/menu?table=2\nWi-Fi card,WIFI:T:WPA;S:Cafe;P:espresso;;"} value={text} onChange={(e) => setText(e.target.value)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label className="text-[13px]">Style</Label>
            <Select value={styleId} onValueChange={setStyleId}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                {QR_PRESETS.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                {templates.map((t) => <SelectItem key={t.id} value={t.id}>★ {t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-[13px]">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
                <SelectItem value="jpeg">JPG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-[13px]">Size</Label>
            <Select value={String(size)} onValueChange={(v) => setSize(Number(v))} disabled={format === "svg"}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[512, 1024, 2048].map((s) => <SelectItem key={s} value={String(s)}>{s}px</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {invalid.length > 0 && (
          <p className="text-xs text-destructive">{invalid.length} row{invalid.length === 1 ? "" : "s"} can&apos;t be encoded (too long): {invalid.slice(0, 3).map((r) => r.name).join(", ")}</p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={saveAll} disabled={!rows.length || rows.length > 500 || invalid.length > 0 || saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Save {rows.length || ""} to library
          </Button>
          <Button onClick={generateZip} disabled={!rows.length || rows.length > 500 || invalid.length > 0 || progress !== null}>
            {progress !== null ? <><Loader2 className="animate-spin" /> {progress}%</> : <><PackageOpen /> Download ZIP</>}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm lg:sticky lg:top-20">
        <div className="text-sm font-medium">Preview {rows.length > 0 && <span className="text-muted-foreground">· {rows.length} codes</span>}</div>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Paste rows to preview your batch.</p>
        ) : (
          <div className="grid max-h-[480px] grid-cols-3 gap-2 overflow-y-auto">
            {rows.slice(0, 30).map((r, i) => (
              <div key={i} className="min-w-0">
                <QrSvg content={r.value} config={style} className="overflow-hidden rounded border" />
                <div className="mt-1 truncate text-[10px] text-muted-foreground">{r.name}</div>
              </div>
            ))}
          </div>
        )}
        {rows.length > 30 && <p className="text-xs text-muted-foreground">Showing first 30.</p>}
      </div>
    </div>
  );
}
