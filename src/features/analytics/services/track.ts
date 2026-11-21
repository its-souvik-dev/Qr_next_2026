import "server-only";
import { userAgent } from "next/server";
import { db } from "@/lib/db";
import { hmac } from "@/lib/auth/crypto";
import { env } from "@/lib/env";
import { getClientIpFromHeaders, getCountryFromHeaders } from "@/lib/security/request";

type ClickContext = { linkId: string; collectCountry: boolean; collectReferrer: boolean; ownHosts: string[] };

function deviceType(type: string | undefined) {
  if (type === "mobile" || type === "tablet") return type;
  if (type === "smarttv" || type === "console" || type === "wearable" || type === "embedded") return "other";
  return "desktop";
}

function referrerHost(value: string | null, ownHosts: string[]) {
  if (!value) return null;
  try {
    const host = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    return ownHosts.includes(host) ? null : host.slice(0, 120);
  } catch {
    return null;
  }
}

/**
 * Record a click with privacy-conscious analytics:
 * - the IP address is never stored; it's only used (with the UA) in a keyed hash that rotates daily,
 *   so a visitor can be counted once per day but not tracked across days or links,
 * - only the referrer *hostname* is kept,
 * - country comes from the hosting platform's geo header (no IP geolocation database),
 * - bots and link-preview crawlers are skipped.
 */
export async function recordClick(headers: Headers, ctx: ClickContext) {
  const ua = userAgent({ headers });
  if (ua.isBot) return;

  const day = new Date().toISOString().slice(0, 10);
  const visitorHash = hmac(`${env().APP_SECRET}:${day}`, `${ctx.linkId}|${getClientIpFromHeaders(headers)}|${headers.get("user-agent") ?? ""}`).slice(0, 32);

  await db.$transaction([
    db.linkClick.create({
      data: {
        linkId: ctx.linkId,
        visitorHash,
        device: deviceType(ua.device.type),
        browser: ua.browser.name?.slice(0, 40) ?? null,
        os: ua.os.name?.slice(0, 40) ?? null,
        country: ctx.collectCountry ? getCountryFromHeaders(headers) : null,
        referrer: ctx.collectReferrer ? referrerHost(headers.get("referer"), ctx.ownHosts) : null,
      },
    }),
    db.shortLink.update({ where: { id: ctx.linkId }, data: { clickCount: { increment: 1 }, lastClickedAt: new Date() } }),
  ]);
}
