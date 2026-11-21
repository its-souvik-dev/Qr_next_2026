"use client";

import { createContext, createElement, useContext, useState, type ReactNode } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { DEFAULT_QR_STYLE, type QRStyleConfig } from "@/lib/qr/config";
import { applyPreset } from "@/lib/qr/presets";
import { EMPTY_CONTENT } from "@/features/qr/types";
import type { QrContentInput, QrContentType } from "@/features/qr/schemas/content";

export type ExportUnit = "px" | "in" | "cm";
export type ExportFormat = "png" | "jpeg" | "svg" | "webp";

export type ExportSettings = {
  format: ExportFormat;
  unit: ExportUnit;
  /** Pixel size when unit = px. */
  sizePx: number;
  /** Physical size when unit = in/cm. */
  physical: number;
  dpi: number;
  transparent: boolean;
  quality: number;
};

type ContentMap = { [K in QrContentType]: Extract<QrContentInput, { type: K }> };

export type QrStudioState = {
  id: string | null;
  name: string;
  type: QrContentType;
  contents: ContentMap;
  style: QRStyleConfig;
  shortLinkId: string | null;
  exportSettings: ExportSettings;
  dirty: boolean;
  /** Fields the user has interacted with (validation errors only show for these). */
  touched: Record<string, boolean>;
};

export type QrStudioActions = {
  setName: (name: string) => void;
  setType: (type: QrContentType) => void;
  updateContent: <K extends QrContentType>(type: K, patch: Partial<ContentMap[K]>) => void;
  touch: (field: string) => void;
  touchAll: () => void;
  setStyle: (updater: (style: QRStyleConfig) => QRStyleConfig) => void;
  applyPreset: (config: QRStyleConfig) => void;
  loadTemplate: (config: QRStyleConfig) => void;
  setExport: (patch: Partial<ExportSettings>) => void;
  markSaved: (id: string) => void;
};

export type QrStudioStore = QrStudioState & QrStudioActions;

export type QrStudioInit = Partial<Pick<QrStudioState, "id" | "name" | "type" | "style" | "shortLinkId">> & {
  content?: QrContentInput;
};

export const DEFAULT_EXPORT: ExportSettings = {
  format: "png",
  unit: "px",
  sizePx: 1024,
  physical: 2,
  dpi: 300,
  transparent: false,
  quality: 92,
};

export function exportPixelSize(s: ExportSettings) {
  if (s.unit === "px") return s.sizePx;
  const inches = s.unit === "in" ? s.physical : s.physical / 2.54;
  return Math.max(64, Math.min(8000, Math.round(inches * s.dpi)));
}

function createQrStudioStore(init: QrStudioInit) {
  const contents = { ...EMPTY_CONTENT } as ContentMap;
  if (init.content) (contents as Record<string, QrContentInput>)[init.content.type] = init.content;
  const type = init.content?.type ?? init.type ?? "URL";

  return createStore<QrStudioStore>()((set) => ({
    id: init.id ?? null,
    name: init.name ?? "",
    type,
    contents,
    style: init.style ?? DEFAULT_QR_STYLE,
    shortLinkId: init.shortLinkId ?? null,
    exportSettings: { ...DEFAULT_EXPORT, sizePx: init.style?.size ?? DEFAULT_EXPORT.sizePx },
    dirty: false,
    touched: {},

    setName: (name) => set({ name, dirty: true }),
    setType: (type) => set({ type, dirty: true }),
    updateContent: (type, patch) =>
      set((s) => ({ contents: { ...s.contents, [type]: { ...s.contents[type], ...patch } }, dirty: true })),
    touch: (field) => set((s) => (s.touched[field] ? s : { touched: { ...s.touched, [field]: true } })),
    touchAll: () => set({ touched: { __all: true } }),
    setStyle: (updater) => set((s) => ({ style: updater(s.style), dirty: true })),
    applyPreset: (config) => set((s) => ({ style: applyPreset(s.style, config), dirty: true })),
    loadTemplate: (config) => set({ style: config, dirty: true }),
    setExport: (patch) => set((s) => ({ exportSettings: { ...s.exportSettings, ...patch } })),
    markSaved: (id) => set({ id, dirty: false }),
  }));
}

const StudioContext = createContext<StoreApi<QrStudioStore> | null>(null);

export function QrStudioProvider({ init, children }: { init: QrStudioInit; children: ReactNode }) {
  const [store] = useState(() => createQrStudioStore(init));
  return createElement(StudioContext.Provider, { value: store }, children);
}

export function useQrStudio<T>(selector: (state: QrStudioStore) => T): T {
  const store = useContext(StudioContext);
  if (!store) throw new Error("useQrStudio must be used inside <QrStudioProvider>");
  return useStore(store, selector);
}

export function useQrStudioApi() {
  const store = useContext(StudioContext);
  if (!store) throw new Error("useQrStudioApi must be used inside <QrStudioProvider>");
  return store;
}
