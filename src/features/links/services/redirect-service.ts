import "server-only";
import { db } from "@/lib/db";
import { checkDestinationUrl } from "@/lib/validations/url";
import { SLUG_PATTERN } from "@/lib/utils/slug";

export type ResolvedLink =
  | { status: "ok"; id: string; destination: string; protected: boolean; collectCountry: boolean; collectReferrer: boolean }
  | { status: "not-found" | "disabled" | "expired" | "blocked" };

/** Look up a slug for redirecting. Host-aware: links bound to a custom domain only resolve there (or on the app host). */
export async function resolveLink(slug: string, host: string, appHosts: string[]): Promise<ResolvedLink> {
  if (!SLUG_PATTERN.test(slug)) return { status: "not-found" };
  const link = await db.shortLink.findUnique({
    where: { slug },
    select: {
      id: true,
      destinationUrl: true,
      isActive: true,
      expiresAt: true,
      passwordHash: true,
      domain: { select: { hostname: true, verifiedAt: true } },
      user: { select: { settings: { select: { collectCountry: true, collectReferrer: true } } } },
    },
  });
  if (!link) return { status: "not-found" };

  const onAppHost = appHosts.includes(host);
  if (!onAppHost && (!link.domain?.verifiedAt || link.domain.hostname !== host)) return { status: "not-found" };
  if (!link.isActive) return { status: "disabled" };
  if (link.expiresAt && link.expiresAt <= new Date()) return { status: "expired" };

  // Re-validate at redirect time: rules may have tightened since the link was created.
  const check = checkDestinationUrl(link.destinationUrl, { appHosts });
  if (!check.ok) return { status: "blocked" };

  return {
    status: "ok",
    id: link.id,
    destination: check.url,
    protected: link.passwordHash !== null,
    collectCountry: link.user.settings?.collectCountry ?? true,
    collectReferrer: link.user.settings?.collectReferrer ?? true,
  };
}

export async function getLinkPasswordHash(slug: string) {
  if (!SLUG_PATTERN.test(slug)) return null;
  return db.shortLink.findUnique({
    where: { slug },
    select: { id: true, passwordHash: true, destinationUrl: true, isActive: true, expiresAt: true, user: { select: { settings: { select: { collectCountry: true, collectReferrer: true } } } } },
  });
}

export function appHostList(): string[] {
  const hosts = new Set(["localhost", "127.0.0.1"]);
  try {
    hosts.add(new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").hostname);
  } catch {}
  for (const h of (process.env.APP_HOSTNAMES ?? "").split(",")) if (h.trim()) hosts.add(h.trim().toLowerCase());
  return [...hosts];
}
