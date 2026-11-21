"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrSvg } from "@/components/qr-generator/qr-svg";
import { QR_PRESETS } from "@/lib/qr/presets";
import type { QRStyleConfig } from "@/lib/qr/config";
import { useQrStudio } from "@/stores/qr-studio-store";
import { deleteTemplateAction, saveTemplateAction } from "../../actions";
import { Section } from "./section";

export type SavedStyle = { id: string; name: string; config: QRStyleConfig };

export function PresetsPanel({ templates }: { templates: SavedStyle[] }) {
  const style = useQrStudio((s) => s.style);
  const applyPreset = useQrStudio((s) => s.applyPreset);
  const loadTemplate = useQrStudio((s) => s.loadTemplate);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);
  // Local copy so saving/deleting doesn't need a route refresh (which would remount the studio).
  const [saved, setSaved] = useState(templates);

  function save() {
    start(async () => {
      const trimmed = name.trim();
      const result = await saveTemplateAction({ name: trimmed, config: style });
      if (result.ok) {
        toast.success(result.message);
        setName("");
        setSaved((list) => [{ id: result.data.id, name: trimmed, config: style }, ...list.filter((t) => t.id !== result.data.id)]);
      } else toast.error(result.error);
    });
  }

  async function remove(id: string) {
    setDeleting(id);
    const result = await deleteTemplateAction(id);
    setDeleting(null);
    if (result.ok) {
      toast.success(result.message);
      setSaved((list) => list.filter((t) => t.id !== id));
    } else toast.error(result.error);
  }

  return (
    <div className="grid gap-6">
      <Section title="Style presets" description="Applies colors and shapes. Your content, logo and size are kept.">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {QR_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                applyPreset(p.config);
                toast.success(`Applied “${p.name}”`);
              }}
              className="group flex flex-col gap-1.5 rounded-lg border bg-card p-2 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <QrSvg content="https://maxqr.app" config={p.config} className="w-full overflow-hidden rounded" />
              <span className="truncate text-[11px] font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="My styles" description="Save the current design (including logo) to reuse it on other codes.">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) save();
          }}
        >
          <Input placeholder="Style name, e.g. Brand primary" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-label="Style name" />
          <Button type="submit" variant="secondary" disabled={!name.trim() || pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />} Save
          </Button>
        </form>
        {saved.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">No saved styles yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {saved.map((t) => (
              <div key={t.id} className="group relative rounded-lg border bg-card p-2">
                <button type="button" className="flex w-full flex-col gap-1.5 text-left" onClick={() => { loadTemplate(t.config); toast.success(`Loaded “${t.name}”`); }}>
                  <QrSvg content="https://maxqr.app" config={t.config} className="w-full overflow-hidden rounded" />
                  <span className="truncate text-[11px] font-medium">{t.name}</span>
                </button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  aria-label={`Delete style ${t.name}`}
                  className="absolute top-1 right-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  disabled={deleting === t.id}
                  onClick={() => remove(t.id)}
                >
                  {deleting === t.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
