import type { Metadata } from "next";
import { Suspense } from "react";
import { Brand } from "@/components/shared/brand";
import { UnavailableMessage } from "@/features/links/components/unavailable-message";

export const metadata: Metadata = { title: "Link unavailable", robots: { index: false, follow: false } };

export default function LinkUnavailablePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/30 px-4 text-center">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <Suspense>
          <UnavailableMessage />
        </Suspense>
      </div>
      <Brand className="mt-8 text-sm text-muted-foreground" />
    </div>
  );
}
