import type { Fill, LogoConfig, QRStyleConfig } from "./config";
import { alignmentCenters, createMatrix, isFinderModule, resolveEcc, type QrMatrix } from "./matrix";
import { circlePath, cornerDotPath, cornerSquarePath, modulePath, roundedRectPath, UNIT, type FinderCorner } from "./shapes";

/** Styles whose modules don't touch; their alignment patterns are drawn solid to keep detection reliable. */
const DISCONNECTED_STYLES = new Set(["dots", "diamond", "vertical", "horizontal"]);

export type RenderOptions = {
  /** Output width/height in px. Defaults to config.size. Ignored when `responsive`. */
  size?: number;
  /** Use 100% width/height (for previews that scale with their container). */
  responsive?: boolean;
  /** Force a transparent background regardless of config (export option). */
  transparent?: boolean;
  /** Prefix for <defs> ids. Defaults to a hash of the inputs, so it's stable across server/client. */
  idPrefix?: string;
};

export type RenderResult = {
  svg: string;
  matrix: QrMatrix;
  /** Number of data modules hidden behind the logo. */
  hiddenModules: number;
  /** Total dark+light data modules (excluding finder patterns). */
  dataModules: number;
  /** True if the logo box overlaps a finder pattern. */
  logoOverlapsFinder: boolean;
};

const esc = (v: string | number) =>
  String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const f = (n: number) => Math.round(n * 100) / 100;

function hashString(input: string) {
  let h = 5381;
  let h2 = 52711;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h = ((h << 5) + h + ch) | 0;
    h2 = ((h2 << 5) + h2 + ch * 31) | 0;
  }
  return (h >>> 0).toString(36) + (h2 >>> 0).toString(36);
}

class Defs {
  private parts: string[] = [];
  private count = 0;
  constructor(private prefix: string, private width: number) {}

  /** Returns a value usable in a fill attribute (color or url(#id)). */
  paint(fill: Fill): string {
    if (fill.type === "solid") return fill.color;
    const id = `${this.prefix}-g${this.count++}`;
    const stops = [...fill.stops]
      .sort((a, b) => a.offset - b.offset)
      .map((s) => `<stop offset="${f(s.offset)}" stop-color="${esc(s.color)}"/>`)
      .join("");
    const w = this.width;
    if (fill.type === "linear") {
      const rad = (fill.rotation * Math.PI) / 180;
      const dx = (Math.cos(rad) * w) / 2;
      const dy = (Math.sin(rad) * w) / 2;
      this.parts.push(
        `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(w / 2 - dx)}" y1="${f(w / 2 - dy)}" x2="${f(w / 2 + dx)}" y2="${f(w / 2 + dy)}">${stops}</linearGradient>`,
      );
    } else {
      this.parts.push(
        `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(w / 2)}" cy="${f(w / 2)}" r="${f(w * 0.6)}">${stops}</radialGradient>`,
      );
    }
    return `url(#${id})`;
  }

  /** Same as paint() but with gradient coordinates local to a box (for logo backgrounds). */
  paintBox(fill: Fill, x: number, y: number, size: number): string {
    if (fill.type === "solid") return fill.color;
    const id = `${this.prefix}-g${this.count++}`;
    const stops = [...fill.stops]
      .sort((a, b) => a.offset - b.offset)
      .map((s) => `<stop offset="${f(s.offset)}" stop-color="${esc(s.color)}"/>`)
      .join("");
    const cx = x + size / 2;
    const cy = y + size / 2;
    if (fill.type === "linear") {
      const rad = (fill.rotation * Math.PI) / 180;
      const dx = (Math.cos(rad) * size) / 2;
      const dy = (Math.sin(rad) * size) / 2;
      this.parts.push(
        `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(cx - dx)}" y1="${f(cy - dy)}" x2="${f(cx + dx)}" y2="${f(cy + dy)}">${stops}</linearGradient>`,
      );
    } else {
      this.parts.push(
        `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(size * 0.6)}">${stops}</radialGradient>`,
      );
    }
    return `url(#${id})`;
  }

  add(markup: string) {
    const id = `${this.prefix}-d${this.count++}`;
    this.parts.push(markup.replace("__ID__", id));
    return id;
  }

  toString() {
    return this.parts.length ? `<defs>${this.parts.join("")}</defs>` : "";
  }
}

type LogoBox = { cx: number; cy: number; size: number; shape: LogoConfig["shape"] };

function logoBox(logo: LogoConfig, count: number, offset: number): LogoBox {
  const inner = count * UNIT;
  const size = logo.size * inner;
  return {
    cx: offset + inner / 2 + logo.offsetX * inner,
    cy: offset + inner / 2 + logo.offsetY * inner,
    size,
    shape: logo.shape,
  };
}

/** Whether a module is (at least mostly) covered by the logo container. */
function coveredByLogo(box: LogoBox, x: number, y: number) {
  const mx = x + UNIT / 2;
  const my = y + UNIT / 2;
  const pad = UNIT * 0.45;
  if (box.shape === "circle") {
    return Math.hypot(mx - box.cx, my - box.cy) <= box.size / 2 + pad;
  }
  return Math.abs(mx - box.cx) <= box.size / 2 + pad && Math.abs(my - box.cy) <= box.size / 2 + pad;
}

function shapePath(shape: LogoConfig["shape"], x: number, y: number, size: number, radius: number) {
  if (shape === "circle") return circlePath(x + size / 2, y + size / 2, size / 2);
  const r = Math.min(radius, size / 2);
  return roundedRectPath(x, y, x + size, y + size, [r, r, r, r]);
}

function renderLogo(logo: LogoConfig, box: LogoBox, defs: Defs): string {
  const { size } = box;
  const x = box.cx - size / 2;
  const y = box.cy - size / 2;
  const radius = logo.borderRadius * size;
  const parts: string[] = [];

  let filterAttr = "";
  if (logo.shadow) {
    const id = defs.add(
      `<filter id="__ID__" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="${f(size * 0.03)}" stdDeviation="${f(size * 0.045)}" flood-color="#000" flood-opacity="0.28"/></filter>`,
    );
    filterAttr = ` filter="url(#${id})"`;
  }

  if (logo.background.enabled) {
    const paint = defs.paintBox(logo.background.fill, x, y, size);
    parts.push(
      `<path d="${shapePath(logo.shape, x, y, size, radius)}" fill="${esc(paint)}" fill-opacity="${f(logo.background.opacity)}"${filterAttr}/>`,
    );
  }

  const borderW = logo.border.width * size;
  if (borderW > 0) {
    const inset = borderW / 2;
    parts.push(
      `<path d="${shapePath(logo.shape, x + inset, y + inset, size - borderW, Math.max(0, radius - inset))}" fill="none" stroke="${esc(logo.border.color)}" stroke-width="${f(borderW)}"/>`,
    );
  }

  if (logo.ring) {
    const inset = size * 0.075;
    const ringW = Math.max(size * 0.012, 0.6);
    parts.push(
      `<path d="${shapePath(logo.shape, x + inset, y + inset, size - 2 * inset, Math.max(0, radius - inset))}" fill="none" stroke="${esc(logo.border.color)}" stroke-width="${f(ringW)}" stroke-opacity="0.85"/>`,
    );
  }

  const pad = logo.padding * size;
  const imgSize = Math.max(1, size - 2 * pad);
  const ix = x + pad;
  const iy = y + pad;
  let clipAttr = "";
  if (logo.clipImage) {
    const innerRadius = logo.shape === "circle" ? 0 : Math.max(0, radius - pad);
    const id = defs.add(
      `<clipPath id="__ID__"><path d="${shapePath(logo.shape, ix, iy, imgSize, innerRadius)}"/></clipPath>`,
    );
    clipAttr = ` clip-path="url(#${id})"`;
  }
  const aspect = logo.clipImage ? "xMidYMid slice" : "xMidYMid meet";
  const imageFilter = !logo.background.enabled && logo.shadow ? filterAttr : "";
  parts.push(
    `<image href="${esc(logo.src)}" x="${f(ix)}" y="${f(iy)}" width="${f(imgSize)}" height="${f(imgSize)}" preserveAspectRatio="${aspect}"${clipAttr}${imageFilter}/>`,
  );

  return `<g class="qr-logo">${parts.join("")}</g>`;
}

/**
 * Render a fully static QR code to an SVG string.
 * The encoded content is embedded directly in the symbol — no redirect service is involved.
 */
export function renderQrSvg(content: string, config: QRStyleConfig, options: RenderOptions = {}): RenderResult {
  const ecc = resolveEcc(config);
  const matrix = createMatrix(content, ecc);
  const count = matrix.size;
  const offset = config.margin * UNIT;
  const width = (count + config.margin * 2) * UNIT;
  const prefix = options.idPrefix ?? `qr${hashString(content + JSON.stringify(config) + (options.transparent ? "t" : ""))}`;
  const defs = new Defs(prefix, width);

  // Background
  const bg: string[] = [];
  const bgRadius = config.background.radius * width;
  const transparent = options.transparent || config.background.transparent;
  const bgShape = roundedRectPath(0, 0, width, width, [bgRadius, bgRadius, bgRadius, bgRadius]);
  if (!transparent) {
    bg.push(`<path d="${bgShape}" fill="${esc(defs.paint(config.background.fill))}"/>`);
  }
  if (config.background.image) {
    const clip = defs.add(`<clipPath id="__ID__"><path d="${bgShape}"/></clipPath>`);
    bg.push(
      `<image href="${esc(config.background.image.src)}" x="0" y="0" width="${width}" height="${width}" preserveAspectRatio="xMidYMid slice" opacity="${f(config.background.image.opacity)}" clip-path="url(#${clip})"/>`,
    );
  }

  // Data modules
  const box = config.logo ? logoBox(config.logo, count, offset) : null;
  const excavate = Boolean(config.logo?.excavate);
  let hiddenModules = 0;
  let dataModules = 0;
  const dark = (r: number, c: number) => matrix.isDark(r, c) && !isFinderModule(r, c, count);
  const d: string[] = [];

  // Solid alignment patterns for disconnected styles.
  const alignment = new Set<number>();
  if (DISCONNECTED_STYLES.has(config.dots.style)) {
    for (const [ar, ac] of alignmentCenters(matrix.version)) {
      const ax = offset + (ac - 2) * UNIT;
      const ay = offset + (ar - 2) * UNIT;
      if (box && excavate && coveredByLogo(box, offset + ac * UNIT, offset + ar * UNIT)) continue;
      for (let r = ar - 2; r <= ar + 2; r++) for (let c = ac - 2; c <= ac + 2; c++) alignment.add(r * count + c);
      const s = 5 * UNIT;
      const rad = 1.6 * UNIT;
      d.push(
        roundedRectPath(ax, ay, ax + s, ay + s, [rad, rad, rad, rad]) +
          // inner cut-out drawn counter-clockwise so nonzero fill leaves a ring
          `M${ax + UNIT} ${ay + UNIT + 0.8 * UNIT}V${ay + 4 * UNIT - 0.8 * UNIT}A${0.8 * UNIT} ${0.8 * UNIT} 0 0 0 ${ax + UNIT + 0.8 * UNIT} ${ay + 4 * UNIT}H${ax + 4 * UNIT - 0.8 * UNIT}A${0.8 * UNIT} ${0.8 * UNIT} 0 0 0 ${ax + 4 * UNIT} ${ay + 4 * UNIT - 0.8 * UNIT}V${ay + UNIT + 0.8 * UNIT}A${0.8 * UNIT} ${0.8 * UNIT} 0 0 0 ${ax + 4 * UNIT - 0.8 * UNIT} ${ay + UNIT}H${ax + UNIT + 0.8 * UNIT}A${0.8 * UNIT} ${0.8 * UNIT} 0 0 0 ${ax + UNIT} ${ay + UNIT + 0.8 * UNIT}Z` +
          circlePath(offset + ac * UNIT + UNIT / 2, offset + ar * UNIT + UNIT / 2, UNIT * 0.55),
      );
    }
  }

  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (isFinderModule(r, c, count)) continue;
      if (alignment.has(r * count + c)) {
        dataModules++;
        continue;
      }
      dataModules++;
      const x = offset + c * UNIT;
      const y = offset + r * UNIT;
      if (box && coveredByLogo(box, x, y)) {
        hiddenModules++;
        if (excavate) continue;
      }
      if (!matrix.isDark(r, c)) continue;
      const hidden = (rr: number, cc: number) =>
        excavate && box !== null && coveredByLogo(box, offset + cc * UNIT, offset + rr * UNIT);
      const neighbor = (rr: number, cc: number) => dark(rr, cc) && !hidden(rr, cc);
      d.push(
        modulePath(x, y, config.dots.style, {
          top: neighbor(r - 1, c),
          right: neighbor(r, c + 1),
          bottom: neighbor(r + 1, c),
          left: neighbor(r, c - 1),
        }),
      );
    }
  }
  const dotsPaint = defs.paint(config.dots.fill);

  // Finder patterns
  const finders: [number, number, FinderCorner][] = [
    [0, 0, "tl"],
    [0, count - 7, "tr"],
    [count - 7, 0, "bl"],
  ];
  const squarePaint = config.cornerSquare.fill ? defs.paint(config.cornerSquare.fill) : dotsPaint;
  const dotPaint = config.cornerDot.fill ? defs.paint(config.cornerDot.fill) : squarePaint;
  const squares = finders
    .map(([r, c, corner]) => cornerSquarePath(offset + c * UNIT, offset + r * UNIT, config.cornerSquare.style, corner))
    .join("");
  const eyes = finders
    .map(([r, c, corner]) => cornerDotPath(offset + c * UNIT, offset + r * UNIT, config.cornerDot.style, corner))
    .join("");

  let logoOverlapsFinder = false;
  let logoMarkup = "";
  if (config.logo && box) {
    const half = box.size / 2;
    const finderEdge = offset + 8 * UNIT;
    const farEdge = offset + (count - 8) * UNIT;
    const left = box.cx - half;
    const right = box.cx + half;
    const top = box.cy - half;
    const bottom = box.cy + half;
    logoOverlapsFinder =
      (left < finderEdge && top < finderEdge) || (right > farEdge && top < finderEdge) || (left < finderEdge && bottom > farEdge);
    logoMarkup = renderLogo(config.logo, box, defs);
  }

  const dims = options.responsive
    ? `width="100%" height="100%"`
    : `width="${options.size ?? config.size}" height="${options.size ?? config.size}"`;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${width}" ${dims} shape-rendering="geometricPrecision">` +
    defs.toString() +
    bg.join("") +
    `<path d="${d.join("")}" fill="${esc(dotsPaint)}"/>` +
    `<path d="${squares}" fill="${esc(squarePaint)}" fill-rule="evenodd"/>` +
    `<path d="${eyes}" fill="${esc(dotPaint)}"/>` +
    logoMarkup +
    `</svg>`;

  return { svg, matrix, hiddenModules, dataModules, logoOverlapsFinder };
}
