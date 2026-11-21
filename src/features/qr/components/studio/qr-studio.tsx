"use client";

import { Download, Image as ImageIcon, LayoutTemplate, Palette, Shapes, Type } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrStudioProvider, type QrStudioInit } from "@/stores/qr-studio-store";
import { ContentForm, QrTypeSelector } from "../content-form";
import { ColorsPanel } from "./colors-panel";
import { DesignPanel } from "./design-panel";
import { ExportPanel } from "./export-panel";
import { LogoPanel } from "./logo-panel";
import { PresetsPanel, type SavedStyle } from "./presets-panel";
import { PreviewPanel } from "./preview-panel";

const TABS = [
  { id: "content", label: "Content", icon: Type },
  { id: "design", label: "Design", icon: Shapes },
  { id: "colors", label: "Colors", icon: Palette },
  { id: "logo", label: "Logo", icon: ImageIcon },
  { id: "presets", label: "Presets", icon: LayoutTemplate },
  { id: "export", label: "Export", icon: Download },
] as const;

export function QrStudio({ init, templates, lockedContent }: { init: QrStudioInit; templates: SavedStyle[]; lockedContent?: string }) {
  return (
    <QrStudioProvider init={init}>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:gap-8">
        <div className="min-w-0 rounded-xl border bg-card shadow-sm">
          <Tabs defaultValue="content" className="gap-0">
            <div className="overflow-x-auto border-b px-2 pt-2 [scrollbar-width:none]">
              <TabsList className="h-auto w-max gap-1 bg-transparent p-0">
                {TABS.map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className="rounded-b-none border-0 border-b-2 border-transparent px-3 pb-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent"
                  >
                    <t.icon className="size-4" /> {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="p-4 sm:p-6">
              <TabsContent value="content" className="grid gap-6">
                {lockedContent ? (
                  <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                    <div className="font-medium">Short link QR code</div>
                    <p className="mt-1 text-muted-foreground">
                      This code points to <span className="font-mono text-foreground">{lockedContent}</span>. Change the destination any time from the link&apos;s settings — the printed code stays the same.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3">
                      <h3 className="text-sm font-semibold">What should the code do?</h3>
                      <QrTypeSelector />
                    </div>
                    <ContentForm />
                  </>
                )}
              </TabsContent>
              <TabsContent value="design"><DesignPanel /></TabsContent>
              <TabsContent value="colors"><ColorsPanel /></TabsContent>
              <TabsContent value="logo"><LogoPanel /></TabsContent>
              <TabsContent value="presets"><PresetsPanel templates={templates} /></TabsContent>
              <TabsContent value="export"><ExportPanel /></TabsContent>
            </div>
          </Tabs>
        </div>
        <div className="lg:sticky lg:top-20">
          <PreviewPanel />
        </div>
      </div>
    </QrStudioProvider>
  );
}
