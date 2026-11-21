import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <defs>
        <linearGradient id="brand-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.62 0.2 277)" />
          <stop offset="1" stopColor="oklch(0.5 0.22 300)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#brand-g)" />
      <path
        d="M8 8h6v6H8zM18 8h6v6h-6zM8 18h6v6H8z"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="18.5" y="18.5" width="2.5" height="2.5" rx="0.6" fill="white" />
      <rect x="22" y="22" width="2.5" height="2.5" rx="0.6" fill="white" />
      <rect x="22" y="18.5" width="2.5" height="2.5" rx="0.6" fill="white" opacity="0.6" />
      <rect x="18.5" y="22" width="2.5" height="2.5" rx="0.6" fill="white" opacity="0.6" />
    </svg>
  );
}

export function Brand({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <BrandMark />
      <span>{siteConfig.name}</span>
    </Link>
  );
}
