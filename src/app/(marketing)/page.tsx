import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Download,
  Fingerprint,
  ImagePlus,
  Infinity as InfinityIcon,
  Layers,
  Link2,
  Lock,
  Palette,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QrSvg } from "@/components/qr-generator/qr-svg";
import { QR_PRESETS } from "@/lib/qr/presets";
import { QR_TYPES } from "@/features/qr/types";

const FEATURES = [
  { icon: InfinityIcon, title: "Truly static codes", text: "Your URL, Wi-Fi password or vCard is encoded directly into the image. No redirect, no subscription — it works forever." },
  { icon: Palette, title: "Design studio", text: "9 dot styles, 5 frame and eye styles, solid colors, linear and radial gradients, background images and rounded cards." },
  { icon: ImagePlus, title: "Premium logos", text: "Ten logo treatments — circular, badge, floating, gradient plate and more — with padding, borders, opacity and placement." },
  { icon: ScanLine, title: "Readability guard", text: "Live checks for contrast, quiet zone and logo coverage, with error correction raised automatically when you add a logo." },
  { icon: Download, title: "Print-ready export", text: "PNG, JPG, WebP and SVG up to 8000px or by physical size at 300/600 DPI. Preview the exact file before you download." },
  { icon: Layers, title: "Batch generation", text: "Paste or import a CSV and get hundreds of styled codes in one ZIP — or save them all to your library." },
  { icon: Link2, title: "Short links", text: "Custom or random slugs, tags and categories, expiration dates, password protection, bulk import and CSV export." },
  { icon: BarChart3, title: "Click analytics", text: "Daily, weekly and monthly clicks, countries, devices, browsers, OS and referrers — with date filters per link." },
  { icon: Fingerprint, title: "Privacy first", text: "No IP addresses stored. Visitors are counted with a daily-rotating hash, and you choose how long data is kept." },
];

export default function HomePage() {
  const showcase = [QR_PRESETS[3]!, QR_PRESETS[2]!, QR_PRESETS[7]!, QR_PRESETS[10]!];
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="absolute top-[-20%] left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 md:pt-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-xs backdrop-blur">
              <ShieldCheck className="size-3.5 text-success" /> Static codes never expire
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              QR codes worth <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">putting your brand on</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
              Design beautiful static QR codes with logos, gradients and custom shapes — plus a fast, privacy-conscious link shortener with analytics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {/* sign-up disabled: <Button size="lg" asChild><Link href="/register">Start creating — free <ArrowRight /></Link></Button> */}
              <Button size="lg" asChild><Link href="/login">Sign in <ArrowRight /></Link></Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">{QR_TYPES.map((t) => t.label).join(" · ")}</p>
          </div>
          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4">
            {showcase.map((p, i) => (
              <div key={p.id} className={`rounded-2xl border bg-card p-3 shadow-xl shadow-black/5 transition-transform hover:-translate-y-1 ${i % 2 ? "translate-y-8" : ""}`}>
                <QrSvg content={`https://maxqr.app/s/${p.id}`} config={p.config} className="overflow-hidden rounded-lg" />
                <div className="mt-2 px-1 text-xs font-medium text-muted-foreground">{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-16 border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">Everything you need, nothing that breaks</h2>
            <p className="mt-3 text-muted-foreground">A professional studio for static codes, and a complete URL shortener when you need to change destinations or measure results.</p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card p-6">
                <div className="flex size-9 items-center justify-center rounded-lg border bg-background shadow-xs"><f.icon className="size-4 text-primary" /></div>
                <h3 className="mt-4 font-medium">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-2">
          <div className="rounded-2xl border p-6">
            <InfinityIcon className="size-5 text-primary" />
            <h3 className="mt-3 text-lg font-semibold">Static QR codes</h3>
            <p className="mt-2 text-sm text-muted-foreground">Best for Wi-Fi, contact cards, text and links that won&apos;t change. Content lives in the code — it works offline and forever, even if you close your account.</p>
          </div>
          <div className="rounded-2xl border p-6">
            <Lock className="size-5 text-primary" />
            <h3 className="mt-3 text-lg font-semibold">Short-link QR codes</h3>
            <p className="mt-2 text-sm text-muted-foreground">Encode a short link instead and you can edit the destination, set expiry or a password, and see every scan in analytics — without reprinting.</p>
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Make your first code in under a minute</h2>
          <p className="mt-3 max-w-lg text-muted-foreground">Free to use. No watermark, no scan limits, no expiry on static codes.</p>
          <Button size="lg" className="mt-8" asChild><Link href="/login">Sign in to get started <ArrowRight /></Link></Button>
        </div>
      </section>
    </>
  );
}
