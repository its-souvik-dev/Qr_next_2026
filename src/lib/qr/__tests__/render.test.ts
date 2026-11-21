import { describe, expect, it } from "vitest";
import sharp from "sharp";
import jsQR from "jsqr";
import { DEFAULT_QR_STYLE, DOT_STYLES, CORNER_SQUARE_STYLES, CORNER_DOT_STYLES, type QRStyleConfig } from "../config";
import { renderQrSvg } from "../render";
import { analyzeReadability } from "../analyze";
import { QR_PRESETS } from "../presets";
import { DEFAULT_LOGO, LOGO_STYLES, applyLogoStyle } from "../logo-styles";

async function decode(svg: string, size = 600) {
  const { data, info } = await sharp(Buffer.from(svg), { density: 144 })
    .resize(size, size)
    .flatten({ background: "#ffffff" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data ?? null;
}

// 64x64 solid red PNG as a stand-in logo
async function logoDataUrl() {
  const png = await sharp({ create: { width: 64, height: 64, channels: 4, background: "#e11d48" } }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

const CONTENT = "https://example.com/products/category/product-name?ref=qr";

describe("renderQrSvg", () => {
  it("produces a valid svg with deterministic ids", () => {
    const a = renderQrSvg(CONTENT, DEFAULT_QR_STYLE).svg;
    const b = renderQrSvg(CONTENT, DEFAULT_QR_STYLE).svg;
    expect(a).toBe(b);
    expect(a.startsWith("<svg")).toBe(true);
  });

  it("uses different gradient ids for different configs", () => {
    const grad = (color: string): QRStyleConfig => ({
      ...DEFAULT_QR_STYLE,
      dots: { style: "rounded", fill: { type: "linear", rotation: 0, stops: [{ offset: 0, color }, { offset: 1, color: "#000000" }] } },
    });
    const id = (svg: string) => /id="([^"]+)"/.exec(svg)?.[1];
    expect(id(renderQrSvg(CONTENT, grad("#111111")).svg)).not.toBe(id(renderQrSvg(CONTENT, grad("#222222")).svg));
  });

  it.each(DOT_STYLES)("dot style %s scans", async (style) => {
    const { svg } = renderQrSvg(CONTENT, { ...DEFAULT_QR_STYLE, dots: { ...DEFAULT_QR_STYLE.dots, style } });
    expect(await decode(svg)).toBe(CONTENT);
  });

  it.each(CORNER_SQUARE_STYLES.flatMap((s) => CORNER_DOT_STYLES.map((d) => [s, d] as const)))(
    "corner %s / %s scans",
    async (square, dot) => {
      const { svg } = renderQrSvg(CONTENT, {
        ...DEFAULT_QR_STYLE,
        cornerSquare: { style: square, fill: null },
        cornerDot: { style: dot, fill: null },
      });
      expect(await decode(svg)).toBe(CONTENT);
    },
  );

  it.each(QR_PRESETS.map((p) => [p.name, p.config] as const))("preset %s scans", async (_name, config) => {
    const { svg } = renderQrSvg(CONTENT, config);
    expect(await decode(svg)).toBe(CONTENT);
  });

  it.each(LOGO_STYLES.map((s) => s.id))("logo style %s scans and is flagged readable", async (id) => {
    const logo = applyLogoStyle({ ...DEFAULT_LOGO, src: await logoDataUrl() }, id, "#4f46e5");
    const config: QRStyleConfig = { ...DEFAULT_QR_STYLE, logo };
    const result = renderQrSvg(CONTENT, config);
    expect(result.matrix.ecc).toBe("H");
    expect(await decode(result.svg)).toBe(CONTENT);
    expect(analyzeReadability(config, result).level).not.toBe("danger");
  });

  it("flags an oversized logo as dangerous", async () => {
    const config: QRStyleConfig = {
      ...DEFAULT_QR_STYLE,
      errorCorrection: "L",
      logo: { ...DEFAULT_LOGO, src: await logoDataUrl(), size: 0.38 },
    };
    const report = analyzeReadability(config, renderQrSvg(CONTENT, config));
    expect(report.level).toBe("danger");
  });

  it("flags low contrast", () => {
    const config: QRStyleConfig = { ...DEFAULT_QR_STYLE, dots: { style: "square", fill: { type: "solid", color: "#eeeeee" } } };
    expect(analyzeReadability(config, renderQrSvg(CONTENT, config)).level).toBe("danger");
  });

  it("rejects content that is too long", () => {
    expect(() => renderQrSvg("x".repeat(4000), { ...DEFAULT_QR_STYLE, errorCorrection: "H" })).toThrow(/too long/);
  });
});
