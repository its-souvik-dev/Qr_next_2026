import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { marketingNav } from "@/config/navigation";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background/70 backdrop-blur-lg supports-[backdrop-filter]:border-border/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Brand />
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          {marketingNav.map((item) => <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">{item.title}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" asChild><Link href="/login">Sign in</Link></Button>
          {/* sign-up disabled
          <Button size="sm" asChild><Link href="/register">Get started</Link></Button>
          */}
        </div>
      </div>
    </header>
  );
}
