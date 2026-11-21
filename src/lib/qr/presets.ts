import { DEFAULT_QR_STYLE, type QRStyleConfig } from "./config";

export type QrPreset = { id: string; name: string; config: QRStyleConfig };

type PresetPatch = Partial<Omit<QRStyleConfig, "logo" | "version" | "size">>;

function preset(id: string, name: string, patch: PresetPatch): QrPreset {
  return {
    id,
    name,
    config: {
      ...DEFAULT_QR_STYLE,
      ...patch,
      background: { ...DEFAULT_QR_STYLE.background, ...patch.background },
      logo: null,
    },
  };
}

const lin = (rotation: number, a: string, b: string) => ({
  type: "linear" as const,
  rotation,
  stops: [{ offset: 0, color: a }, { offset: 1, color: b }],
});

/** Built-in style presets. Presets only change appearance — they never touch content or logo. */
export const QR_PRESETS: QrPreset[] = [
  preset("minimal-bw", "Minimal Black & White", {
    dots: { style: "square", fill: { type: "solid", color: "#000000" } },
    cornerSquare: { style: "square", fill: null },
    cornerDot: { style: "square", fill: null },
  }),
  preset("modern-blue", "Modern Blue", {
    dots: { style: "rounded", fill: { type: "solid", color: "#1d4ed8" } },
    cornerSquare: { style: "extra-rounded", fill: { type: "solid", color: "#1e3a8a" } },
    cornerDot: { style: "dot", fill: { type: "solid", color: "#2563eb" } },
    background: { transparent: false, fill: { type: "solid", color: "#ffffff" }, radius: 0, image: null },
  }),
  preset("premium-dark", "Premium Dark", {
    dots: { style: "classy-rounded", fill: { type: "solid", color: "#111111" } },
    cornerSquare: { style: "extra-rounded", fill: { type: "solid", color: "#a16207" } },
    cornerDot: { style: "dot", fill: { type: "solid", color: "#111111" } },
    background: { transparent: false, fill: { type: "solid", color: "#fefce8" }, radius: 0.06, image: null },
  }),
  preset("gradient-purple", "Gradient Purple", {
    dots: { style: "extra-rounded", fill: lin(45, "#7c3aed", "#db2777") },
    cornerSquare: { style: "extra-rounded", fill: null },
    cornerDot: { style: "dot", fill: null },
  }),
  preset("corporate", "Corporate", {
    dots: { style: "square", fill: { type: "solid", color: "#0f172a" } },
    cornerSquare: { style: "rounded", fill: { type: "solid", color: "#0369a1" } },
    cornerDot: { style: "rounded", fill: { type: "solid", color: "#0f172a" } },
  }),
  preset("restaurant", "Restaurant", {
    dots: { style: "dots", fill: { type: "solid", color: "#7c2d12" } },
    cornerSquare: { style: "classy", fill: { type: "solid", color: "#9a3412" } },
    cornerDot: { style: "classy", fill: null },
    background: { transparent: false, fill: { type: "solid", color: "#fff7ed" }, radius: 0.05, image: null },
  }),
  preset("business-card", "Business Card", {
    margin: 2,
    dots: { style: "classy", fill: { type: "solid", color: "#1f2937" } },
    cornerSquare: { style: "classy", fill: null },
    cornerDot: { style: "classy", fill: null },
  }),
  preset("instagram", "Instagram", {
    dots: { style: "extra-rounded", fill: { type: "linear", rotation: 45, stops: [{ offset: 0, color: "#f58529" }, { offset: 0.5, color: "#dd2a7b" }, { offset: 1, color: "#515bd4" }] } },
    cornerSquare: { style: "extra-rounded", fill: null },
    cornerDot: { style: "dot", fill: null },
  }),
  preset("whatsapp", "WhatsApp", {
    dots: { style: "rounded", fill: { type: "solid", color: "#075e54" } },
    cornerSquare: { style: "extra-rounded", fill: { type: "solid", color: "#128c7e" } },
    cornerDot: { style: "dot", fill: { type: "solid", color: "#25a244" } },
    background: { transparent: false, fill: { type: "solid", color: "#f0fdf4" }, radius: 0.04, image: null },
  }),
  preset("ecommerce", "E-commerce", {
    dots: { style: "rounded", fill: lin(90, "#ea580c", "#b91c1c") },
    cornerSquare: { style: "rounded", fill: { type: "solid", color: "#1f2937" } },
    cornerDot: { style: "rounded", fill: { type: "solid", color: "#ea580c" } },
  }),
  preset("creative", "Creative Colorful", {
    dots: { style: "dots", fill: { type: "radial", stops: [{ offset: 0, color: "#0891b2" }, { offset: 0.6, color: "#7c3aed" }, { offset: 1, color: "#be185d" }] } },
    cornerSquare: { style: "dot", fill: { type: "solid", color: "#be185d" } },
    cornerDot: { style: "dot", fill: { type: "solid", color: "#0891b2" } },
  }),
  preset("elegant", "Elegant Minimal", {
    margin: 4,
    dots: { style: "vertical", fill: { type: "solid", color: "#334155" } },
    cornerSquare: { style: "rounded", fill: null },
    cornerDot: { style: "rounded", fill: null },
    background: { transparent: false, fill: { type: "solid", color: "#f8fafc" }, radius: 0.08, image: null },
  }),
];

/** Apply a preset while preserving size, logo, ECC and background image choices. */
export function applyPreset(current: QRStyleConfig, presetConfig: QRStyleConfig): QRStyleConfig {
  return {
    ...presetConfig,
    size: current.size,
    errorCorrection: current.errorCorrection,
    logo: current.logo,
    background: { ...presetConfig.background, image: current.background.image },
  };
}
