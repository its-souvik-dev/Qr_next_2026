"use client";

import { useDeferredValue, useMemo } from "react";
import { analyzeReadability, type ReadabilityReport } from "@/lib/qr/analyze";
import type { QRStyleConfig } from "@/lib/qr/config";
import { QrContentError } from "@/lib/qr/matrix";
import { renderQrSvg, type RenderResult } from "@/lib/qr/render";
import { useQrStudio } from "@/stores/qr-studio-store";
import { validateAndEncode } from "../schemas/content";

export type QrPreviewState =
  | { status: "empty"; errors: Record<string, string> }
  | { status: "error"; message: string; errors: Record<string, string> }
  | { status: "ready"; encoded: string; result: RenderResult; report: ReadabilityReport; errors: Record<string, string> };

export function useEncodedContent() {
  const content = useQrStudio((s) => s.contents[s.type]);
  return useMemo(() => validateAndEncode(content), [content]);
}

/** Live preview: validates content, renders SVG and analyzes readability. Deferred so typing stays smooth. */
export function useQrPreview(): QrPreviewState {
  const encoded = useEncodedContent();
  const style = useQrStudio((s) => s.style);
  const deferredStyle = useDeferredValue(style);
  const deferredEncoded = useDeferredValue(encoded);
  return useMemo(() => computePreview(deferredEncoded, deferredStyle), [deferredEncoded, deferredStyle]);
}

export function computePreview(encoded: ReturnType<typeof validateAndEncode>, style: QRStyleConfig): QrPreviewState {
  if (!encoded.ok) return { status: "empty", errors: encoded.errors };
  try {
    const result = renderQrSvg(encoded.encoded, style, { responsive: true });
    return { status: "ready", encoded: encoded.encoded, result, report: analyzeReadability(style, result), errors: {} };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof QrContentError ? error.message : "Couldn't render this QR code",
      errors: {},
    };
  }
}
