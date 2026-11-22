import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { QrStudio } from "@/features/qr/components/studio/qr-studio";

export const metadata: Metadata = {
  title: "Free QR code generator",
  description:
    "Create and download a styled QR code for free — no account needed. Everything is generated in your browser; nothing is uploaded or stored.",
};

/**
 * Public generator: the full design studio without an account.
 * Runs entirely client-side (preview, logo processing and PNG/JPG/WebP/SVG export) —
 * no database writes and no calls to the authenticated API routes.
 */
export default function PublicGeneratorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
      <div className="pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-xs">
          <ShieldCheck className="size-3.5 text-success" /> No sign-up · Nothing is stored
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Free QR code generator</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Enter your content, style it, and download. Your QR code is created right in your browser — no account, no tracking, and it never expires.
        </p>
      </div>
      <QrStudio templates={[]} init={{ publicMode: true }} />
    </div>
  );
}
