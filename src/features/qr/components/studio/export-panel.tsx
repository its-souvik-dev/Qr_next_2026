"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SliderField } from "@/components/qr-customizer/slider-field";
import { FormField } from "@/components/shared/form-field";
import { cn } from "@/lib/utils";
import { exportPixelSize, useQrStudio, type ExportFormat, type ExportUnit } from "@/stores/qr-studio-store";
import { Section } from "./section";

const FORMATS: { value: ExportFormat; label: string; hint: string }[] = [
  { value: "png", label: "PNG", hint: "Lossless, supports transparency" },
  { value: "svg", label: "SVG", hint: "Vector — infinitely scalable, best for print" },
  { value: "jpeg", label: "JPG", hint: "Smallest files, no transparency" },
  { value: "webp", label: "WebP", hint: "Modern web format with transparency" },
];
const PX_PRESETS = [512, 1024, 2048, 4096];

export function ExportPanel() {
  const s = useQrStudio((st) => st.exportSettings);
  const setExport = useQrStudio((st) => st.setExport);
  const px = exportPixelSize(s);

  return (
    <div className="grid gap-6">
      <Section title="Format">
        <div role="radiogroup" aria-label="Export format" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={s.format === f.value}
              onClick={() => setExport({ format: f.value, transparent: f.value === "jpeg" ? false : s.transparent })}
              className={cn(
                "rounded-lg border bg-card px-3 py-2 text-left transition-all hover:border-foreground/20",
                s.format === f.value && "border-primary ring-1 ring-primary",
              )}
            >
              <div className="text-sm font-semibold">{f.label}</div>
              <div className="text-[11px] leading-tight text-muted-foreground">{f.hint}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Dimensions" description={`Output: ${px} × ${px} px${s.unit !== "px" ? ` at ${s.dpi} DPI` : ""}`}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Unit" htmlFor="exp-unit">
            <Select value={s.unit} onValueChange={(v) => setExport({ unit: v as ExportUnit })}>
              <SelectTrigger id="exp-unit" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="px">Pixels (screen)</SelectItem>
                <SelectItem value="in">Inches (print)</SelectItem>
                <SelectItem value="cm">Centimeters (print)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {s.unit === "px" ? (
            <FormField label="Size (px)" htmlFor="exp-px">
              <Input id="exp-px" type="number" min={64} max={8000} value={s.sizePx} onChange={(e) => setExport({ sizePx: Math.max(64, Math.min(8000, Number(e.target.value) || 64)) })} />
            </FormField>
          ) : (
            <FormField label={`Size (${s.unit})`} htmlFor="exp-phys">
              <Input id="exp-phys" type="number" step="0.1" min={0.5} max={s.unit === "in" ? 26 : 66} value={s.physical} onChange={(e) => setExport({ physical: Math.max(0.5, Number(e.target.value) || 1) })} />
            </FormField>
          )}
        </div>
        {s.unit === "px" ? (
          <div className="flex flex-wrap gap-2">
            {PX_PRESETS.map((p) => (
              <button key={p} type="button" onClick={() => setExport({ sizePx: p })} className={cn("rounded-md border px-2.5 py-1 text-xs tabular-nums transition-colors hover:bg-accent", s.sizePx === p && "border-primary bg-primary/5 text-primary")}>
                {p}px
              </button>
            ))}
          </div>
        ) : (
          <FormField label="Print resolution" htmlFor="exp-dpi" hint="300 DPI is standard for print. Use SVG for unlimited scaling.">
            <Select value={String(s.dpi)} onValueChange={(v) => setExport({ dpi: Number(v) })}>
              <SelectTrigger id="exp-dpi" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[150, 300, 600].map((d) => <SelectItem key={d} value={String(d)}>{d} DPI</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
        )}
      </Section>

      <Section title="Options">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="exp-transparent" className="text-[13px]">Transparent background</Label>
            <p className="text-xs text-muted-foreground">{s.format === "jpeg" ? "Not available for JPG" : "Removes the background fill on export"}</p>
          </div>
          <Switch id="exp-transparent" disabled={s.format === "jpeg"} checked={s.transparent} onCheckedChange={(transparent) => setExport({ transparent })} />
        </div>
        {(s.format === "jpeg" || s.format === "webp") && (
          <SliderField label="Quality" value={s.quality} min={40} max={100} format={(v) => `${v}%`} onChange={(quality) => setExport({ quality })} />
        )}
      </Section>
    </div>
  );
}
