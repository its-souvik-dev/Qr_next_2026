"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FillEditor } from "@/components/qr-customizer/fill-editor";
import { ImageUpload } from "@/components/qr-customizer/image-upload";
import { SliderField } from "@/components/qr-customizer/slider-field";
import { useQrStudio } from "@/stores/qr-studio-store";
import { Section } from "./section";

export function ColorsPanel() {
  const style = useQrStudio((s) => s.style);
  const setStyle = useQrStudio((s) => s.setStyle);

  return (
    <div className="grid gap-6">
      <Section title="Foreground">
        <FillEditor label="Dots" value={style.dots.fill} onChange={(fill) => setStyle((s) => ({ ...s, dots: { ...s.dots, fill } }))} />
        <div className="flex items-center justify-between">
          <Label htmlFor="sq-custom" className="text-[13px]">Custom corner frame color</Label>
          <Switch
            id="sq-custom"
            checked={style.cornerSquare.fill !== null}
            onCheckedChange={(on) => setStyle((s) => ({ ...s, cornerSquare: { ...s.cornerSquare, fill: on ? s.dots.fill : null } }))}
          />
        </div>
        {style.cornerSquare.fill && (
          <FillEditor label="Corner frames" value={style.cornerSquare.fill} onChange={(fill) => setStyle((s) => ({ ...s, cornerSquare: { ...s.cornerSquare, fill } }))} />
        )}
        <div className="flex items-center justify-between">
          <Label htmlFor="dot-custom" className="text-[13px]">Custom corner eye color</Label>
          <Switch
            id="dot-custom"
            checked={style.cornerDot.fill !== null}
            onCheckedChange={(on) => setStyle((s) => ({ ...s, cornerDot: { ...s.cornerDot, fill: on ? (s.cornerSquare.fill ?? s.dots.fill) : null } }))}
          />
        </div>
        {style.cornerDot.fill && (
          <FillEditor label="Corner eyes" value={style.cornerDot.fill} onChange={(fill) => setStyle((s) => ({ ...s, cornerDot: { ...s.cornerDot, fill } }))} />
        )}
      </Section>

      <Section title="Background">
        <div className="flex items-center justify-between">
          <Label htmlFor="bg-transparent" className="text-[13px]">Transparent background</Label>
          <Switch id="bg-transparent" checked={style.background.transparent} onCheckedChange={(transparent) => setStyle((s) => ({ ...s, background: { ...s.background, transparent } }))} />
        </div>
        {!style.background.transparent && (
          <FillEditor label="Background color" value={style.background.fill} onChange={(fill) => setStyle((s) => ({ ...s, background: { ...s.background, fill } }))} />
        )}
        <SliderField
          label="Corner radius"
          value={Math.round(style.background.radius * 100)}
          min={0}
          max={50}
          format={(v) => `${v}%`}
          onChange={(v) => setStyle((s) => ({ ...s, background: { ...s.background, radius: v / 100 } }))}
        />
      </Section>

      <Section
        title="Background image"
        description="Placed behind the code. Keep it subtle for reliable scanning."
        action={
          style.background.image && (
            <Button variant="ghost" size="sm" onClick={() => setStyle((s) => ({ ...s, background: { ...s.background, image: null } }))}>
              <Trash2 /> Remove
            </Button>
          )
        }
      >
        {style.background.image ? (
          <SliderField
            label="Image opacity"
            value={Math.round(style.background.image.opacity * 100)}
            min={5}
            max={100}
            format={(v) => `${v}%`}
            onChange={(v) => setStyle((s) => ({ ...s, background: { ...s.background, image: s.background.image && { ...s.background.image, opacity: v / 100 } } }))}
          />
        ) : null}
        <ImageUpload
          kind="background"
          compact={!!style.background.image}
          label={style.background.image ? "Replace image" : "Upload background image"}
          onUploaded={(img) => setStyle((s) => ({ ...s, background: { ...s.background, image: { src: img.dataUrl, opacity: s.background.image?.opacity ?? 0.25 } } }))}
        />
      </Section>
    </div>
  );
}
