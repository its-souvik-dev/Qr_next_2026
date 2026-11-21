"use client";

import { useMemo } from "react";
import { Crosshair, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ColorInput } from "@/components/qr-customizer/color-input";
import { FillEditor } from "@/components/qr-customizer/fill-editor";
import { ImageUpload } from "@/components/qr-customizer/image-upload";
import { OptionGrid } from "@/components/qr-customizer/option-grid";
import { SliderField } from "@/components/qr-customizer/slider-field";
import { QrSvg } from "@/components/qr-generator/qr-svg";
import { DEFAULT_QR_STYLE, type LogoConfig, type LogoStyleId } from "@/lib/qr/config";
import { primaryColor } from "@/lib/qr/color";
import { DEFAULT_LOGO, LOGO_STYLES, applyLogoStyle } from "@/lib/qr/logo-styles";
import { useQrStudio } from "@/stores/qr-studio-store";
import { Section } from "./section";

function Toggle({ id, label, checked, onChange, hint }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <Label htmlFor={id} className="text-[13px]">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function LogoPanel() {
  const style = useQrStudio((s) => s.style);
  const setStyle = useQrStudio((s) => s.setStyle);
  const logo = style.logo;
  const accent = primaryColor(style.dots.fill);

  const setLogo = (patch: Partial<LogoConfig>) => setStyle((s) => (s.logo ? { ...s, logo: { ...s.logo, ...patch } } : s));

  const styleOptions = useMemo(() => {
    if (!logo) return [];
    const sample = { ...DEFAULT_QR_STYLE, margin: 1, dots: style.dots, cornerSquare: style.cornerSquare, cornerDot: style.cornerDot, errorCorrection: "H" as const };
    return LOGO_STYLES.map((def) => ({
      value: def.id,
      label: def.name,
      preview: <QrSvg className="w-full" content="https://maxqr.app" config={{ ...sample, logo: { ...applyLogoStyle(logo, def.id, accent), size: 0.3, offsetX: 0, offsetY: 0 } }} />,
    }));
  }, [logo, style.dots, style.cornerSquare, style.cornerDot, accent]);

  if (!logo) {
    return (
      <div className="grid gap-4">
        <Section title="Logo" description="Place your brand in the center. Error correction is raised automatically to keep the code scannable.">
          <ImageUpload
            kind="logo"
            label="Upload your logo"
            onUploaded={(img) =>
              setStyle((s) => ({ ...s, logo: applyLogoStyle({ ...DEFAULT_LOGO, src: img.dataUrl }, "rounded", accent) }))
            }
          />
        </Section>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Section
        title="Logo"
        action={
          <Button variant="ghost" size="sm" onClick={() => setStyle((s) => ({ ...s, logo: null }))}>
            <Trash2 /> Remove
          </Button>
        }
      >
        <div className="flex items-center gap-3">
          <div className="checkerboard flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element -- sanitized data URL */}
            <img src={logo.src} alt="Uploaded logo" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex-1">
            <ImageUpload kind="logo" compact label="Replace logo" onUploaded={(img) => setLogo({ src: img.dataUrl })} />
          </div>
        </div>
      </Section>

      <Section title="Logo style">
        <OptionGrid<LogoStyleId> label="Logo style" columns={5} options={styleOptions} value={logo.style} onChange={(id) => setStyle((s) => (s.logo ? { ...s, logo: applyLogoStyle(s.logo, id, accent) } : s))} />
      </Section>

      <Section title="Size & shape">
        <SliderField label="Logo size" value={Math.round(logo.size * 100)} min={10} max={38} format={(v) => `${v}%`} onChange={(v) => setLogo({ size: v / 100 })} />
        <SliderField label="Padding" value={Math.round(logo.padding * 100)} min={0} max={40} format={(v) => `${v}%`} onChange={(v) => setLogo({ padding: v / 100 })} />
        <div className="grid grid-cols-2 gap-2">
          <Button variant={logo.shape === "circle" ? "secondary" : "outline"} size="sm" onClick={() => setLogo({ shape: "circle" })}>Circle</Button>
          <Button variant={logo.shape === "rect" ? "secondary" : "outline"} size="sm" onClick={() => setLogo({ shape: "rect" })}>Rectangle</Button>
        </div>
        {logo.shape === "rect" && (
          <SliderField label="Border radius" value={Math.round(logo.borderRadius * 100)} min={0} max={50} format={(v) => `${v}%`} onChange={(v) => setLogo({ borderRadius: v / 100 })} />
        )}
      </Section>

      <Section
        title="Position"
        description="Centered placement scans best."
        action={
          (logo.offsetX !== 0 || logo.offsetY !== 0) && (
            <Button variant="ghost" size="sm" onClick={() => setLogo({ offsetX: 0, offsetY: 0 })}>
              <Crosshair /> Center
            </Button>
          )
        }
      >
        <SliderField label="Horizontal" value={Math.round(logo.offsetX * 100)} min={-30} max={30} format={(v) => `${v > 0 ? "+" : ""}${v}%`} onChange={(v) => setLogo({ offsetX: v / 100 })} />
        <SliderField label="Vertical" value={Math.round(logo.offsetY * 100)} min={-30} max={30} format={(v) => `${v > 0 ? "+" : ""}${v}%`} onChange={(v) => setLogo({ offsetY: v / 100 })} />
      </Section>

      <Section title="Background plate">
        <Toggle id="logo-bg" label="Show background" checked={logo.background.enabled} onChange={(enabled) => setLogo({ background: { ...logo.background, enabled } })} />
        {logo.background.enabled && (
          <>
            <FillEditor label="Plate color" value={logo.background.fill} onChange={(fill) => setLogo({ background: { ...logo.background, fill } })} />
            <SliderField label="Background opacity" value={Math.round(logo.background.opacity * 100)} min={0} max={100} format={(v) => `${v}%`} onChange={(v) => setLogo({ background: { ...logo.background, opacity: v / 100 } })} />
          </>
        )}
      </Section>

      <Section title="Border & effects">
        <SliderField label="Border thickness" value={Math.round(logo.border.width * 100)} min={0} max={12} format={(v) => `${v}%`} onChange={(v) => setLogo({ border: { ...logo.border, width: v / 100 } })} />
        {(logo.border.width > 0 || logo.ring) && (
          <div className="grid gap-1.5">
            <Label className="text-[13px]">Border color</Label>
            <ColorInput value={logo.border.color} onChange={(color) => setLogo({ border: { ...logo.border, color } })} label="Border color" />
          </div>
        )}
        <Toggle id="logo-ring" label="Inner ring" hint="Badge-style decorative ring" checked={logo.ring} onChange={(ring) => setLogo({ ring })} />
        <Toggle id="logo-shadow" label="Drop shadow" checked={logo.shadow} onChange={(shadow) => setLogo({ shadow })} />
        <Toggle id="logo-clip" label="Crop logo to shape" checked={logo.clipImage} onChange={(clipImage) => setLogo({ clipImage })} />
        <Toggle id="logo-excavate" label="Clear dots behind logo" hint="Recommended for reliable scanning" checked={logo.excavate} onChange={(excavate) => setLogo({ excavate })} />
      </Section>
    </div>
  );
}
