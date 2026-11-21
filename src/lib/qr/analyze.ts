import type { QRStyleConfig } from "./config";
import { contrastRatio, fillColors, luminance } from "./color";
import { ECC_CAPACITY } from "./matrix";
import type { RenderResult } from "./render";

export type ReadabilityLevel = "good" | "warning" | "danger";
export type ReadabilityIssue = { level: Exclude<ReadabilityLevel, "good">; message: string };
export type ReadabilityReport = {
  level: ReadabilityLevel;
  score: number;
  issues: ReadabilityIssue[];
  contrast: number;
  logoCoverage: number;
  eccCapacity: number;
};

/**
 * Heuristic scannability check. Not a substitute for scanning with a real phone,
 * but catches the common ways a custom design breaks QR readers.
 */
export function analyzeReadability(config: QRStyleConfig, result: RenderResult): ReadabilityReport {
  const issues: ReadabilityIssue[] = [];
  const bgColors = config.background.transparent ? ["#ffffff"] : fillColors(config.background.fill);
  const fgColors = [
    ...fillColors(config.dots.fill),
    ...(config.cornerSquare.fill ? fillColors(config.cornerSquare.fill) : []),
    ...(config.cornerDot.fill ? fillColors(config.cornerDot.fill) : []),
  ];

  let contrast = Infinity;
  for (const fg of fgColors) for (const bg of bgColors) contrast = Math.min(contrast, contrastRatio(fg, bg));

  if (contrast < 2.5) issues.push({ level: "danger", message: `Very low contrast (${contrast.toFixed(1)}:1). Most scanners will fail — aim for 4:1 or higher.` });
  else if (contrast < 4) issues.push({ level: "warning", message: `Low contrast (${contrast.toFixed(1)}:1). Darken the code or lighten the background.` });

  const fgLum = Math.max(...fgColors.map(luminance));
  const bgLum = Math.min(...bgColors.map(luminance));
  if (!config.background.transparent && fgLum > bgLum) {
    issues.push({ level: "warning", message: "Inverted colors (light code on dark background) aren't supported by some older scanners." });
  }
  if (config.background.transparent) {
    issues.push({ level: "warning", message: "Transparent background: make sure the code is placed on a light, plain surface." });
  }
  if (config.background.image) {
    issues.push({ level: "warning", message: "Background images reduce contrast. Keep the image subtle (low opacity) and test-scan before printing." });
  }

  if (config.margin < 1) issues.push({ level: "danger", message: "No quiet zone. Add a margin of at least 2 modules." });
  else if (config.margin < 2) issues.push({ level: "warning", message: "Small quiet zone. A margin of 2–4 modules scans most reliably." });

  const eccCapacity = ECC_CAPACITY[result.matrix.ecc];
  const logoCoverage = config.logo ? result.hiddenModules / Math.max(1, result.dataModules) : 0;
  if (config.logo) {
    // Leave headroom: damaged modules cost more than their share because of codeword boundaries.
    const safe = eccCapacity * 0.55;
    if (logoCoverage > eccCapacity * 0.85) {
      issues.push({ level: "danger", message: `Logo covers ${(logoCoverage * 100).toFixed(0)}% of the code — more than error correction ${result.matrix.ecc} can recover. Make the logo smaller.` });
    } else if (logoCoverage > safe) {
      issues.push({ level: "warning", message: `Logo covers ${(logoCoverage * 100).toFixed(0)}% of the code. Consider a smaller logo or error correction H.` });
    }
    if (result.matrix.ecc !== "H" && result.matrix.ecc !== "Q") {
      issues.push({ level: "warning", message: "Use error correction Q or H (or Auto) when adding a logo." });
    }
    if (result.logoOverlapsFinder) {
      issues.push({ level: "danger", message: "The logo overlaps a corner finder pattern. Move it back toward the center." });
    }
    if (!config.logo.excavate && !config.logo.background.enabled) {
      issues.push({ level: "warning", message: "Logo is drawn over the code without a backing. Enable “Clear dots behind logo” for reliable scans." });
    }
  }

  const dangerCount = issues.filter((i) => i.level === "danger").length;
  const warningCount = issues.length - dangerCount;
  const score = Math.max(0, 100 - dangerCount * 40 - warningCount * 12);
  const level: ReadabilityLevel = dangerCount ? "danger" : warningCount ? "warning" : "good";
  return { level, score, issues, contrast: Number.isFinite(contrast) ? contrast : 21, logoCoverage, eccCapacity };
}
