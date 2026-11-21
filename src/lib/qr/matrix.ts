import QRCode from "qrcode";
import type { QRStyleConfig } from "./config";

export type EccLevel = "L" | "M" | "Q" | "H";

export type QrMatrix = {
  size: number;
  version: number;
  ecc: EccLevel;
  isDark: (row: number, col: number) => boolean;
};

/** Recovery capacity per ECC level (fraction of codewords that can be restored). */
export const ECC_CAPACITY: Record<EccLevel, number> = { L: 0.07, M: 0.15, Q: 0.25, H: 0.3 };

/**
 * Pick the error correction level. "auto" raises it when the design obscures modules
 * (logos, background images) so readability is preserved.
 */
export function resolveEcc(config: Pick<QRStyleConfig, "errorCorrection" | "logo" | "background">): EccLevel {
  if (config.errorCorrection !== "auto") return config.errorCorrection;
  if (config.logo) return "H";
  if (config.background.image) return "Q";
  return "M";
}

export class QrContentError extends Error {}

export function createMatrix(content: string, ecc: EccLevel): QrMatrix {
  if (!content) throw new QrContentError("Nothing to encode yet");
  let qr: ReturnType<typeof QRCode.create>;
  try {
    qr = QRCode.create(content, { errorCorrectionLevel: ecc });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new QrContentError(
      /too big|amount of data/i.test(message)
        ? "Content is too long to fit in a QR code at this error-correction level"
        : "This content can't be encoded as a QR code",
    );
  }
  const { size, data } = qr.modules;
  return {
    size,
    version: qr.version,
    ecc,
    isDark: (row, col) => row >= 0 && col >= 0 && row < size && col < size && data[row * size + col] === 1,
  };
}

/** True when (row, col) belongs to one of the three 7×7 finder patterns. */
export function isFinderModule(row: number, col: number, size: number) {
  return (row < 7 && col < 7) || (row < 7 && col >= size - 7) || (row >= size - 7 && col < 7);
}

/** Centre coordinates of the alignment patterns for a QR version (ISO/IEC 18004 Annex E). */
export function alignmentCenters(version: number): [number, number][] {
  if (version === 1) return [];
  const posCount = Math.floor(version / 7) + 2;
  const size = version * 4 + 17;
  const interval = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
  const coords = [size - 7];
  for (let i = 1; i < posCount - 1; i++) coords[i] = coords[i - 1]! - interval;
  coords.push(6);
  coords.reverse();
  const centers: [number, number][] = [];
  const last = coords.length - 1;
  for (let i = 0; i <= last; i++) {
    for (let j = 0; j <= last; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      centers.push([coords[i]!, coords[j]!]);
    }
  }
  return centers;
}
