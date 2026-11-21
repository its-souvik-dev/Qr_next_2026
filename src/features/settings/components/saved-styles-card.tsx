"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Palette, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QrSvg } from "@/components/qr-generator/qr-svg";
import type { QRStyleConfig } from "@/lib/qr/config";
import { deleteTemplateAction } from "@/features/qr/actions";
import { SettingsCard } from "./settings-card";

export function SavedStylesCard({ templates }: { templates: { id: string; name: string; config: QRStyleConfig }[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();
  return (
    <SettingsCard id="styles" title="Saved QR styles" description="Reusable designs you saved from the QR studio's Presets tab.">
      {templates.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <Palette className="size-4" /> No saved styles. <Link className="text-foreground underline" href="/qr-codes/create">Design one in the studio</Link>.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
          {templates.map((t) => (
            <div key={t.id} className="group relative rounded-lg border p-2">
              <QrSvg content="https://maxqr.app" config={t.config} className="overflow-hidden rounded" />
              <div className="mt-1.5 truncate text-xs font-medium">{t.name}</div>
              <Button
                size="icon-xs"
                variant="secondary"
                aria-label={`Delete ${t.name}`}
                className="absolute top-1 right-1 shadow-sm"
                disabled={busy === t.id}
                onClick={async () => {
                  setBusy(t.id);
                  const r = await deleteTemplateAction(t.id);
                  setBusy(null);
                  if (r.ok) {
                    toast.success(r.message);
                    router.refresh();
                  } else toast.error(r.error);
                }}
              >
                {busy === t.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </SettingsCard>
  );
}
