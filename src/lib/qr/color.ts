import type { Fill } from "./config";

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance. */
export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Colors a fill can take — gradients are evaluated at each stop. */
export function fillColors(fill: Fill): string[] {
  return fill.type === "solid" ? [fill.color] : fill.stops.map((s) => s.color);
}

/** Representative color for a fill (first stop / solid color). */
export function primaryColor(fill: Fill) {
  return fill.type === "solid" ? fill.color : fill.stops[0]!.color;
}
