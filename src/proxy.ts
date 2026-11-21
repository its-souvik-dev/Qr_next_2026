import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mq_session";
const PROTECTED_PREFIXES = ["/dashboard", "/qr-codes", "/links", "/analytics", "/settings"];
const SLUG_PATH = /^\/([A-Za-z0-9][A-Za-z0-9_-]{2,48}[A-Za-z0-9])\/?$/;

function appHostnames() {
  const hosts = new Set<string>(["localhost", "127.0.0.1"]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      hosts.add(new URL(appUrl).hostname);
    } catch {}
  }
  for (const h of (process.env.APP_HOSTNAMES ?? "").split(",")) if (h.trim()) hosts.add(h.trim().toLowerCase());
  return hosts;
}

/**
 * Optimistic checks only — real authorization happens in the Data Access Layer.
 * 1. Requests on a branded custom domain (`go.brand.com/abc`) are rewritten to the redirect handler.
 * 2. Signed-out visitors to dashboard routes are sent to /login without rendering the page.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("host") ?? "").split(":")[0]!.toLowerCase();

  if (host && !appHostnames().has(host) && !host.endsWith(".vercel.app")) {
    const match = SLUG_PATH.exec(pathname);
    if (match) {
      const url = request.nextUrl.clone();
      url.pathname = `/s/${match[1]}`;
      return NextResponse.rewrite(url);
    }
  }

  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!request.cookies.has(SESSION_COOKIE)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)"],
};
