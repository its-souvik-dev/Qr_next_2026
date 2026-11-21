/**
 * Public sign-up is disabled — accounts are provisioned via `npm run db:seed`.
 * Set to true to re-enable the /register page and the register action.
 */
export const SIGNUP_ENABLED = false;

export const siteConfig = {
  name: "Max QR",
  tagline: "Beautiful static QR codes and short links that just work.",
  description:
    "Design premium static QR codes with logos, gradients and custom styles — plus a fast, privacy-conscious URL shortener with analytics.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

/** Base URL used to construct public short links. */
export function appUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

export function shortLinkUrl(slug: string, hostname?: string | null) {
  if (hostname) return `https://${hostname}/${slug}`;
  return appUrl(`/s/${slug}`);
}
