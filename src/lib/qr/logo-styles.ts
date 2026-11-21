import type { LogoConfig, LogoStyleId } from "./config";

type LogoStyleDefinition = {
  id: LogoStyleId;
  name: string;
  description: string;
  apply: (logo: LogoConfig, accent: string) => LogoConfig;
};

const base = (logo: LogoConfig): LogoConfig => ({
  ...logo,
  ring: false,
  shadow: false,
  clipImage: false,
  excavate: true,
  border: { ...logo.border, width: 0 },
});

/** The ten logo treatments. Each sets sensible defaults; every value stays user-adjustable. */
export const LOGO_STYLES: LogoStyleDefinition[] = [
  {
    id: "circle",
    name: "Circular",
    description: "Logo cropped to a circle",
    apply: (l) => ({ ...base(l), style: "circle", shape: "circle", padding: 0.08, clipImage: true, background: { enabled: true, fill: { type: "solid", color: "#ffffff" }, opacity: 1 } }),
  },
  {
    id: "rounded",
    name: "Rounded square",
    description: "Soft app-icon corners",
    apply: (l) => ({ ...base(l), style: "rounded", shape: "rect", borderRadius: 0.24, padding: 0.1, clipImage: true, background: { enabled: true, fill: { type: "solid", color: "#ffffff" }, opacity: 1 } }),
  },
  {
    id: "square",
    name: "Square",
    description: "Crisp square plate",
    apply: (l) => ({ ...base(l), style: "square", shape: "rect", borderRadius: 0, padding: 0.1, background: { enabled: true, fill: { type: "solid", color: "#ffffff" }, opacity: 1 } }),
  },
  {
    id: "minimal",
    name: "Minimal transparent",
    description: "Just the logo on a cleared area",
    apply: (l) => ({ ...base(l), style: "minimal", shape: "rect", borderRadius: 0.1, padding: 0.04, background: { ...l.background, enabled: false } }),
  },
  {
    id: "white-circle",
    name: "White circle",
    description: "Logo on a white disc",
    apply: (l) => ({ ...base(l), style: "white-circle", shape: "circle", padding: 0.2, background: { enabled: true, fill: { type: "solid", color: "#ffffff" }, opacity: 1 } }),
  },
  {
    id: "custom-color",
    name: "Brand color",
    description: "Colored plate behind the logo",
    apply: (l, accent) => ({ ...base(l), style: "custom-color", shape: "rect", borderRadius: 0.22, padding: 0.16, background: { enabled: true, fill: { type: "solid", color: accent }, opacity: 1 } }),
  },
  {
    id: "gradient",
    name: "Gradient plate",
    description: "Gradient background behind the logo",
    apply: (l) => ({
      ...base(l),
      style: "gradient",
      shape: "rect",
      borderRadius: 0.26,
      padding: 0.16,
      background: { enabled: true, fill: { type: "linear", rotation: 135, stops: [{ offset: 0, color: "#6366f1" }, { offset: 1, color: "#ec4899" }] }, opacity: 1 },
    }),
  },
  {
    id: "border",
    name: "Bordered",
    description: "White plate with an outline",
    apply: (l, accent) => ({ ...base(l), style: "border", shape: "rect", borderRadius: 0.2, padding: 0.16, border: { width: 0.05, color: accent }, background: { enabled: true, fill: { type: "solid", color: "#ffffff" }, opacity: 1 } }),
  },
  {
    id: "badge",
    name: "Premium badge",
    description: "Seal with inner ring and depth",
    apply: (l, accent) => ({ ...base(l), style: "badge", shape: "circle", padding: 0.2, ring: true, shadow: true, border: { width: 0.035, color: accent }, background: { enabled: true, fill: { type: "solid", color: "#ffffff" }, opacity: 1 } }),
  },
  {
    id: "floating",
    name: "Floating",
    description: "Lifted card with a soft shadow",
    apply: (l) => ({ ...base(l), style: "floating", shape: "rect", borderRadius: 0.28, padding: 0.12, shadow: true, background: { enabled: true, fill: { type: "solid", color: "#ffffff" }, opacity: 1 } }),
  },
];

export const DEFAULT_LOGO: Omit<LogoConfig, "src"> = {
  style: "rounded",
  shape: "rect",
  size: 0.22,
  padding: 0.1,
  borderRadius: 0.24,
  background: { enabled: true, fill: { type: "solid", color: "#ffffff" }, opacity: 1 },
  border: { width: 0, color: "#111827" },
  ring: false,
  shadow: false,
  clipImage: true,
  excavate: true,
  offsetX: 0,
  offsetY: 0,
};

export function applyLogoStyle(logo: LogoConfig, id: LogoStyleId, accent: string): LogoConfig {
  const def = LOGO_STYLES.find((s) => s.id === id);
  return def ? def.apply(logo, accent) : logo;
}
