import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Brand } from "@/components/shared/brand";
import { UnlockForm } from "@/features/links/components/unlock-form";

export const metadata: Metadata = { title: "Protected link", robots: { index: false, follow: false } };

export default function UnlockPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-primary/10">
          <ShieldCheck className="size-5 text-primary" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">This link is password protected</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">Enter the password you were given to continue.</p>
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <UnlockForm />
        </Suspense>
      </div>
      <Brand className="mt-8 text-sm text-muted-foreground" />
    </div>
  );
}
