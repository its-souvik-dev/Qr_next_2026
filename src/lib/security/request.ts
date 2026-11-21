import "server-only";
import { headers } from "next/headers";

/** Best-effort client IP. Only trusted for rate limiting and hashing — never stored. */
export function getClientIpFromHeaders(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "unknown";
}

export async function getClientIp() {
  return getClientIpFromHeaders(await headers());
}

/** Country code supplied by common CDNs / hosting platforms. */
export function getCountryFromHeaders(h: Headers): string | null {
  const value = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? h.get("x-country-code");
  if (!value || !/^[A-Za-z]{2}$/.test(value) || value.toUpperCase() === "XX") return null;
  return value.toUpperCase();
}
