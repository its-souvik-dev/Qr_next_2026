import type { CornerDotStyle, CornerSquareStyle, DotStyle } from "./config";

/** Size of one module in SVG user units. Integers keep the output compact and precise. */
export const UNIT = 10;

const f = (n: number) => Math.round(n * 100) / 100;

type Radii = [tl: number, tr: number, br: number, bl: number];

/** Rectangle path with an independent radius per corner. */
export function roundedRectPath(x0: number, y0: number, x1: number, y1: number, [tl, tr, br, bl]: Radii) {
  let d = `M${f(x0 + tl)} ${f(y0)}H${f(x1 - tr)}`;
  if (tr) d += `A${f(tr)} ${f(tr)} 0 0 1 ${f(x1)} ${f(y0 + tr)}`;
  d += `V${f(y1 - br)}`;
  if (br) d += `A${f(br)} ${f(br)} 0 0 1 ${f(x1 - br)} ${f(y1)}`;
  d += `H${f(x0 + bl)}`;
  if (bl) d += `A${f(bl)} ${f(bl)} 0 0 1 ${f(x0)} ${f(y1 - bl)}`;
  d += `V${f(y0 + tl)}`;
  if (tl) d += `A${f(tl)} ${f(tl)} 0 0 1 ${f(x0 + tl)} ${f(y0)}`;
  return `${d}Z`;
}

export function circlePath(cx: number, cy: number, r: number) {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
}

function diamondPath(cx: number, cy: number, r: number) {
  return `M${f(cx)} ${f(cy - r)}L${f(cx + r)} ${f(cy)}L${f(cx)} ${f(cy + r)}L${f(cx - r)} ${f(cy)}Z`;
}

export type Neighbors = { top: boolean; right: boolean; bottom: boolean; left: boolean };

/**
 * Path for a single data module. Shapes are neighbour-aware: a corner is only rounded when both
 * sides touching it are free, so adjacent modules fuse into smooth connected strokes.
 * Sides that touch a neighbour are pushed outwards slightly to avoid anti-aliasing seams.
 */
export function modulePath(x: number, y: number, style: DotStyle, n: Neighbors): string {
  const u = UNIT;
  const seam = u * 0.04;
  const cx = x + u / 2;
  const cy = y + u / 2;

  switch (style) {
    case "dots":
      return circlePath(cx, cy, u * 0.46);
    case "diamond":
      return diamondPath(cx, cy, u * 0.56);
    case "vertical": {
      const inset = u * 0.1;
      const r = (u - 2 * inset) / 2;
      return roundedRectPath(x + inset, y - (n.top ? seam : 0), x + u - inset, y + u + (n.bottom ? seam : 0), [
        n.top ? 0 : r,
        n.top ? 0 : r,
        n.bottom ? 0 : r,
        n.bottom ? 0 : r,
      ]);
    }
    case "horizontal": {
      const inset = u * 0.1;
      const r = (u - 2 * inset) / 2;
      return roundedRectPath(x - (n.left ? seam : 0), y + inset, x + u + (n.right ? seam : 0), y + u - inset, [
        n.left ? 0 : r,
        n.right ? 0 : r,
        n.right ? 0 : r,
        n.left ? 0 : r,
      ]);
    }
    default: {
      const free = {
        tl: !n.top && !n.left,
        tr: !n.top && !n.right,
        br: !n.bottom && !n.right,
        bl: !n.bottom && !n.left,
      };
      let radii: Radii = [0, 0, 0, 0];
      if (style === "rounded") {
        const r = u * 0.32;
        radii = [free.tl ? r : 0, free.tr ? r : 0, free.br ? r : 0, free.bl ? r : 0];
      } else if (style === "extra-rounded") {
        const r = u * 0.5;
        radii = [free.tl ? r : 0, free.tr ? r : 0, free.br ? r : 0, free.bl ? r : 0];
      } else if (style === "classy") {
        const r = u * 0.5;
        radii = [free.tl ? r : 0, 0, free.br ? r : 0, 0];
      } else if (style === "classy-rounded") {
        const big = u * 0.5;
        const small = u * 0.22;
        radii = [free.tl ? big : 0, free.tr ? small : 0, free.br ? big : 0, free.bl ? small : 0];
      }
      return roundedRectPath(
        x - (n.left ? seam : 0),
        y - (n.top ? seam : 0),
        x + u + (n.right ? seam : 0),
        y + u + (n.bottom ? seam : 0),
        radii,
      );
    }
  }
}

/** Which finder pattern — used to orient asymmetric ("classy") shapes outward. */
export type FinderCorner = "tl" | "tr" | "bl";

function leafRadii(corner: FinderCorner, r: number): Radii {
  // Round the outward-facing corner and its opposite to form a leaf.
  if (corner === "tr") return [0, r, 0, r];
  if (corner === "bl") return [0, r, 0, r];
  return [r, 0, r, 0];
}

/** Outer 7×7 ring of a finder pattern. Rendered with fill-rule="evenodd". */
export function cornerSquarePath(x: number, y: number, style: CornerSquareStyle, corner: FinderCorner): string {
  const u = UNIT;
  const s = 7 * u;
  const ix = x + u;
  const iy = y + u;
  const is = 5 * u;
  switch (style) {
    case "dot":
      return circlePath(x + s / 2, y + s / 2, s / 2) + circlePath(x + s / 2, y + s / 2, s / 2 - u);
    case "rounded":
      return roundedRectPath(x, y, x + s, y + s, [2 * u, 2 * u, 2 * u, 2 * u]) +
        roundedRectPath(ix, iy, ix + is, iy + is, [1.1 * u, 1.1 * u, 1.1 * u, 1.1 * u]);
    case "extra-rounded":
      return roundedRectPath(x, y, x + s, y + s, [3 * u, 3 * u, 3 * u, 3 * u]) +
        roundedRectPath(ix, iy, ix + is, iy + is, [2 * u, 2 * u, 2 * u, 2 * u]);
    case "classy":
      return roundedRectPath(x, y, x + s, y + s, leafRadii(corner, 3 * u)) +
        roundedRectPath(ix, iy, ix + is, iy + is, leafRadii(corner, 2 * u));
    default:
      return roundedRectPath(x, y, x + s, y + s, [0, 0, 0, 0]) + roundedRectPath(ix, iy, ix + is, iy + is, [0, 0, 0, 0]);
  }
}

/** Inner 3×3 eye of a finder pattern. */
export function cornerDotPath(x: number, y: number, style: CornerDotStyle, corner: FinderCorner): string {
  const u = UNIT;
  const x0 = x + 2 * u;
  const y0 = y + 2 * u;
  const s = 3 * u;
  switch (style) {
    case "dot":
      return circlePath(x0 + s / 2, y0 + s / 2, s / 2);
    case "rounded":
      return roundedRectPath(x0, y0, x0 + s, y0 + s, [0.9 * u, 0.9 * u, 0.9 * u, 0.9 * u]);
    case "diamond":
      return diamondPath(x0 + s / 2, y0 + s / 2, s * 0.62);
    case "classy":
      return roundedRectPath(x0, y0, x0 + s, y0 + s, leafRadii(corner, 1.4 * u));
    default:
      return roundedRectPath(x0, y0, x0 + s, y0 + s, [0, 0, 0, 0]);
  }
}
