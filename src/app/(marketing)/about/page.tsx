import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "About", description: "Why we built Max QR: QR codes that respect your brand, your visitors and your long-term needs." };

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-24">
      <h1 className="text-4xl font-semibold tracking-tight">About Max QR</h1>
      <div className="mt-8 grid gap-5 leading-relaxed text-muted-foreground">
        <p>Too many QR generators quietly route your codes through their own servers, then break them when a trial ends. Printed menus, packaging and business cards stop working overnight.</p>
        <p><strong className="text-foreground">Max QR takes the opposite approach.</strong> Static codes encode your content directly — a URL, Wi-Fi credentials, a contact card — so they work forever, with or without us.</p>
        <p>When you genuinely need a changeable destination or scan analytics, you opt in to a short link. Even then we keep analytics privacy-conscious: no IP addresses are stored, unique visitors are approximated with a daily-rotating hash, and you choose how long data is retained.</p>
        <p>And because a QR code is often the most visible thing on a poster or package, we built a real design studio around it — with a readability guard that warns you before a beautiful code becomes an unscannable one.</p>
      </div>
      <Button className="mt-10" asChild><Link href="/login">Sign in</Link></Button>
    </article>
  );
}
