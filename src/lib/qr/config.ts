import { z } from "zod";

/**
 * QR style configuration. This is the single source of truth for how a QR code looks:
 * it drives the live preview, saved QR codes, templates, and every export format.
 * Stored as validated JSON in the database (QRCode.config / QRTemplate.config).
 */

export const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const color = z.string().regex(HEX_COLOR, "Use a hex color like #111827");

// Images are always re-encoded server-side (see /api/uploads) before being embedded.
const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
export const MAX_LOGO_DATA_URL = 1_400_000; // ~1MB binary
export const MAX_BACKGROUND_DATA_URL = 2_800_000; // ~2MB binary

export const DOT_STYLES = [
  "square",
  "rounded",
  "extra-rounded",
  "dots",
  "classy",
  "classy-rounded",
  "diamond",
  "vertical",
  "horizontal",
] as const;
export const CORNER_SQUARE_STYLES = ["square", "rounded", "extra-rounded", "dot", "classy"] as const;
export const CORNER_DOT_STYLES = ["square", "rounded", "dot", "diamond", "classy"] as const;
export const ERROR_CORRECTION_LEVELS = ["auto", "L", "M", "Q", "H"] as const;
export const LOGO_STYLE_IDS = [
  "circle",
  "rounded",
  "square",
  "minimal",
  "white-circle",
  "custom-color",
  "gradient",
  "border",
  "badge",
  "floating",
] as const;

export type DotStyle = (typeof DOT_STYLES)[number];
export type CornerSquareStyle = (typeof CORNER_SQUARE_STYLES)[number];
export type CornerDotStyle = (typeof CORNER_DOT_STYLES)[number];
export type ErrorCorrection = (typeof ERROR_CORRECTION_LEVELS)[number];
export type LogoStyleId = (typeof LOGO_STYLE_IDS)[number];

const gradientStop = z.object({ offset: z.number().min(0).max(1), color });

export const fillSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("solid"), color }),
  z.object({
    type: z.literal("linear"),
    rotation: z.number().min(0).max(360),
    stops: z.array(gradientStop).min(2).max(4),
  }),
  z.object({ type: z.literal("radial"), stops: z.array(gradientStop).min(2).max(4) }),
]);
export type Fill = z.infer<typeof fillSchema>;

export const logoSchema = z.object({
  src: z.string().max(MAX_LOGO_DATA_URL).regex(IMAGE_DATA_URL, "Unsupported logo image"),
  style: z.enum(LOGO_STYLE_IDS),
  shape: z.enum(["circle", "rect"]),
  /** Logo container size as a fraction of the QR symbol width (excluding margin). */
  size: z.number().min(0.1).max(0.38),
  /** Inner padding as a fraction of the container. */
  padding: z.number().min(0).max(0.4),
  /** Corner radius as a fraction of the container (0 = square, 0.5 = pill). Ignored for circles. */
  borderRadius: z.number().min(0).max(0.5),
  background: z.object({
    enabled: z.boolean(),
    fill: fillSchema,
    opacity: z.number().min(0).max(1),
  }),
  border: z.object({ width: z.number().min(0).max(0.12), color }),
  ring: z.boolean(),
  shadow: z.boolean(),
  clipImage: z.boolean(),
  /** Hide QR modules behind the logo (recommended — keeps edges clean and scanning predictable). */
  excavate: z.boolean(),
  offsetX: z.number().min(-0.3).max(0.3),
  offsetY: z.number().min(-0.3).max(0.3),
});
export type LogoConfig = z.infer<typeof logoSchema>;

export const qrStyleSchema = z.object({
  version: z.literal(1),
  /** Default export width/height in pixels. */
  size: z.number().int().min(128).max(4096),
  /** Quiet zone in modules. */
  margin: z.number().int().min(0).max(10),
  errorCorrection: z.enum(ERROR_CORRECTION_LEVELS),
  dots: z.object({ style: z.enum(DOT_STYLES), fill: fillSchema }),
  cornerSquare: z.object({ style: z.enum(CORNER_SQUARE_STYLES), fill: fillSchema.nullable() }),
  cornerDot: z.object({ style: z.enum(CORNER_DOT_STYLES), fill: fillSchema.nullable() }),
  background: z.object({
    transparent: z.boolean(),
    fill: fillSchema,
    /** Corner radius of the background card as a fraction of its size. */
    radius: z.number().min(0).max(0.5),
    image: z
      .object({
        src: z.string().max(MAX_BACKGROUND_DATA_URL).regex(IMAGE_DATA_URL, "Unsupported background image"),
        opacity: z.number().min(0.05).max(1),
      })
      .nullable(),
  }),
  logo: logoSchema.nullable(),
});

export type QRStyleConfig = z.infer<typeof qrStyleSchema>;

export const DEFAULT_QR_STYLE: QRStyleConfig = {
  version: 1,
  size: 1024,
  margin: 3,
  errorCorrection: "auto",
  dots: { style: "rounded", fill: { type: "solid", color: "#111827" } },
  cornerSquare: { style: "extra-rounded", fill: null },
  cornerDot: { style: "dot", fill: null },
  background: { transparent: false, fill: { type: "solid", color: "#ffffff" }, radius: 0, image: null },
  logo: null,
};

/** Parse untrusted/stored JSON into a config, falling back to defaults when invalid. */
export function parseQrStyle(value: unknown): QRStyleConfig {
  const parsed = qrStyleSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_QR_STYLE;
}

export function solid(color: string): Fill {
  return { type: "solid", color };
}
