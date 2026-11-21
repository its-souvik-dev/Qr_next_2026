"use client";

import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptionGrid } from "@/components/qr-customizer/option-grid";
import { SliderField } from "@/components/qr-customizer/slider-field";
import { QrSvg } from "@/components/qr-generator/qr-svg";
import { FormField } from "@/components/shared/form-field";
import {
  CORNER_DOT_STYLES,
  CORNER_SQUARE_STYLES,
  DEFAULT_QR_STYLE,
  DOT_STYLES,
  type CornerDotStyle,
  type CornerSquareStyle,
  type DotStyle,
  type ErrorCorrection,
  type QRStyleConfig,
} from "@/lib/qr/config";
import { useQrStudio } from "@/stores/qr-studio-store";
import { Section } from "./section";

const label = (s: string) => s.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const SAMPLE = "MAXQR";

const ECC_OPTIONS: { value: ErrorCorrection; label: string; hint: string }[] = [
  { value: "auto", label: "Auto (recommended)", hint: "Raised automatically for logos and images" },
  { value: "L", label: "L — 7% recovery", hint: "Smallest code, least damage tolerance" },
  { value: "M", label: "M — 15% recovery", hint: "Good default for plain codes" },
  { value: "Q", label: "Q — 25% recovery", hint: "For codes with images or wear" },
  { value: "H", label: "H — 30% recovery", hint: "Best with logos" },
];

/** Tiny static sample rendered with one style property changed — used for the tile previews. */
function useSampleBase(style: QRStyleConfig): QRStyleConfig {
  return useMemo(
    () => ({ ...DEFAULT_QR_STYLE, margin: 1, dots: { ...style.dots }, cornerSquare: style.cornerSquare, cornerDot: style.cornerDot, errorCorrection: "L" }),
    [style.dots, style.cornerSquare, style.cornerDot],
  );
}

export function DesignPanel() {
  const style = useQrStudio((s) => s.style);
  const setStyle = useQrStudio((s) => s.setStyle);
  const base = useSampleBase(style);

  const dotOptions = useMemo(
    () => DOT_STYLES.map((v) => ({ value: v, label: label(v), preview: <QrSvg className="w-full" content={SAMPLE} config={{ ...base, dots: { ...base.dots, style: v } }} /> })),
    [base],
  );
  const squareOptions = useMemo(
    () => CORNER_SQUARE_STYLES.map((v) => ({ value: v, label: label(v), preview: <QrSvg className="w-full" content={SAMPLE} config={{ ...base, cornerSquare: { ...base.cornerSquare, style: v } }} /> })),
    [base],
  );
  const dotEyeOptions = useMemo(
    () => CORNER_DOT_STYLES.map((v) => ({ value: v, label: label(v), preview: <QrSvg className="w-full" content={SAMPLE} config={{ ...base, cornerDot: { ...base.cornerDot, style: v } }} /> })),
    [base],
  );

  return (
    <div className="grid gap-6">
      <Section title="Dot style" description="Shape of the data modules.">
        <OptionGrid<DotStyle> label="Dot style" columns={5} options={dotOptions} value={style.dots.style} onChange={(v) => setStyle((s) => ({ ...s, dots: { ...s.dots, style: v } }))} />
      </Section>
      <Section title="Corner frames" description="Outer squares of the three position markers.">
        <OptionGrid<CornerSquareStyle> label="Corner frame style" columns={5} options={squareOptions} value={style.cornerSquare.style} onChange={(v) => setStyle((s) => ({ ...s, cornerSquare: { ...s.cornerSquare, style: v } }))} />
      </Section>
      <Section title="Corner eyes" description="Inner dot of the position markers.">
        <OptionGrid<CornerDotStyle> label="Corner eye style" columns={5} options={dotEyeOptions} value={style.cornerDot.style} onChange={(v) => setStyle((s) => ({ ...s, cornerDot: { ...s.cornerDot, style: v } }))} />
      </Section>
      <Section title="Layout & reliability">
        <SliderField label="Quiet zone (margin)" value={style.margin} min={0} max={10} format={(v) => `${v} modules`} onChange={(margin) => setStyle((s) => ({ ...s, margin }))} />
        <FormField label="Error correction" htmlFor="ecc" hint={ECC_OPTIONS.find((o) => o.value === style.errorCorrection)?.hint}>
          <Select value={style.errorCorrection} onValueChange={(v) => setStyle((s) => ({ ...s, errorCorrection: v as ErrorCorrection }))}>
            <SelectTrigger id="ecc" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ECC_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
      </Section>
    </div>
  );
}
