import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { siteConfig } from "@/config/site";

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <Brand />
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{siteConfig.tagline}</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/login" className="hover:text-foreground">Sign in</Link>
          {/* sign-up disabled: <Link href="/register" className="hover:text-foreground">Create account</Link> */}
        </nav>
      </div>
    </footer>
  );
}
