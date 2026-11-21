"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { dashboardNav } from "@/config/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Sidebar navigation. The static fallback (no active highlight) is part of the prerendered shell. */
export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavLinks pathname={null} onNavigate={onNavigate} />}>
      <ActiveNav onNavigate={onNavigate} />
    </Suspense>
  );
}

function ActiveNav({ onNavigate }: { onNavigate?: () => void }) {
  return <NavLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  // "QR Codes" should stay highlighted on detail pages, but not on /qr-codes/create.
  const activeHref = !pathname
    ? undefined
    : dashboardNav.find((item) => isActive(pathname, item.href, item.exact))?.href ??
    (pathname.startsWith("/qr-codes/") && !pathname.startsWith("/qr-codes/create")
      ? "/qr-codes"
      : pathname.startsWith("/links/") && pathname !== "/links/new"
        ? "/links"
        : undefined);

  return (
    <nav className="grid gap-0.5">
      {dashboardNav.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
              active && "bg-sidebar-accent font-medium text-foreground",
            )}
          >
            <item.icon className={cn("size-4 transition-colors", active ? "text-primary" : "group-hover:text-foreground")} />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
