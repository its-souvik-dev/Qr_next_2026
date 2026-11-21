import { NextResponse, after } from "next/server";
import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { getClientIpFromHeaders } from "@/lib/security/request";
import { appHostList, resolveLink } from "@/features/links/services/redirect-service";
import { recordClick } from "@/features/analytics/services/track";

const NO_CACHE = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex" };

/**
 * Short link redirect. Server-side only: the destination is validated on creation and again here,
 * and analytics are recorded after the response is sent so redirects stay fast.
 */
export async function GET(request: Request, ctx: RouteContext<"/s/[slug]">) {
  const { slug } = await ctx.params;
  const url = new URL(request.url);
  const host = (request.headers.get("host") ?? url.hostname).split(":")[0]!.toLowerCase();

  const ip = getClientIpFromHeaders(request.headers);
  if (!rateLimit(`redirect:${ip}`, RATE_LIMITS.redirect).ok) {
    return new NextResponse("Too many requests", { status: 429, headers: { ...NO_CACHE, "Retry-After": "60" } });
  }

  const appHosts = appHostList();
  const link = await resolveLink(slug, host, appHosts);
  const appBase = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;

  if (link.status !== "ok") {
    return NextResponse.redirect(new URL(`/link-unavailable?reason=${link.status}`, appBase), { status: 302, headers: NO_CACHE });
  }
  if (link.protected) {
    return NextResponse.redirect(new URL(`/s/${slug}/unlock`, appBase), { status: 302, headers: NO_CACHE });
  }

  const headers = new Headers(request.headers);
  after(() =>
    recordClick(headers, { linkId: link.id, collectCountry: link.collectCountry, collectReferrer: link.collectReferrer, ownHosts: appHosts }).catch((error) =>
      console.error("[analytics] failed to record click", error),
    ),
  );
  // 302 (not 301) so browsers don't cache the hop — destinations can be edited and every click is counted.
  return NextResponse.redirect(link.destination, { status: 302, headers: NO_CACHE });
}
