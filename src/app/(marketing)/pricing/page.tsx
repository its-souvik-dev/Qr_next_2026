import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Max QR is free: unlimited static QR codes, logo customization, short links and analytics.",
};

const INCLUDED = [
  "Unlimited static QR codes — they never expire",
  "All 11 QR content types",
  "Full design studio, gradients & 10 logo styles",
  "PNG, JPG, WebP & SVG up to 8000px / 600 DPI",
  "Batch generation & saved styles",
  "Short links with custom slugs, expiry & passwords",
  "Bulk link import and CSV export",
  "Privacy-conscious click analytics",
  "Custom branded domains",
];

const FAQ = [
  { q: "Will my static QR codes stop working?", a: "No. Static codes contain your content directly, so they don't depend on our servers. They keep working even if you delete your account." },
  { q: "What's the difference between static and short-link codes?", a: "A static code encodes the final content. A short-link code encodes a short URL that redirects — so you can change the destination and track scans, but it relies on the redirect service." },
  { q: "Do you track my visitors?", a: "Only aggregate, privacy-conscious analytics for your short links: IP addresses are never stored and unique visitors are estimated with a hash that rotates daily. You control retention." },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Simple pricing: free</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Every feature is available on one plan. No watermarks, no scan limits, no expiring codes.</p>
      </div>
      <div className="mx-auto mt-12 max-w-lg rounded-2xl border bg-card p-8 shadow-lg shadow-primary/5">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-semibold tracking-tight">$0</span>
          <span className="text-muted-foreground">forever</span>
        </div>
        <ul className="mt-8 grid gap-3 text-sm">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-success" /> {item}</li>
          ))}
        </ul>
        <Button size="lg" className="mt-8 w-full" asChild><Link href="/login">Sign in</Link></Button>
      </div>
      <div className="mx-auto mt-20 grid max-w-2xl gap-8">
        <h2 className="text-xl font-semibold">Questions</h2>
        {FAQ.map((f) => (
          <div key={f.q}>
            <h3 className="font-medium">{f.q}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
