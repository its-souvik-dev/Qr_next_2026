import { Suspense } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CurrentUserMenu } from "@/components/layout/current-user-menu";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-14 items-center px-4">
          <Brand href="/dashboard" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <DashboardNav />
        </div>
        <div className="border-t p-4 text-xs leading-relaxed text-muted-foreground">
          Static QR codes encode your content directly — they keep working forever.
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <MobileNav />
          <div className="lg:hidden">
            <Brand href="/dashboard" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/qr-codes/create">
                <Plus /> New QR code
              </Link>
            </Button>
            <ThemeToggle />
            <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
              <CurrentUserMenu />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
