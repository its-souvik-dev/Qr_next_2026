/**
 * Destination URL validation shared by the client forms and the server.
 * Protects against open-redirect abuse: only absolute http(s) URLs, no embedded credentials,
 * no private/loopback targets, and no links that point back into the shortener itself.
 */
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /\.localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
  /^\[?fe80:/i,
];

export type UrlCheck = { ok: true; url: string } | { ok: false; reason: string };

export function normalizeUrlInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function checkDestinationUrl(
  input: string,
  options: { appHosts?: string[]; allowPrivate?: boolean } = {},
): UrlCheck {
  const value = normalizeUrlInput(input);
  if (!value) return { ok: false, reason: "Enter a URL" };
  if (value.length > 2048) return { ok: false, reason: "URL is too long (max 2048 characters)" };
  if (/[\u0000-\u001F\u007F\s]/.test(value)) return { ok: false, reason: "URL contains invalid characters" };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: "Enter a valid URL" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "Only http and https links are allowed" };
  }
  if (url.username || url.password) return { ok: false, reason: "URLs with embedded credentials are not allowed" };
  const host = url.hostname.toLowerCase();
  if (!host || (!host.includes(".") && !host.startsWith("["))) {
    return { ok: false, reason: "Enter a URL with a valid domain" };
  }
  if (!options.allowPrivate && PRIVATE_HOST_PATTERNS.some((p) => p.test(host))) {
    return { ok: false, reason: "Links to private or local network addresses are not allowed" };
  }
  if (options.appHosts?.some((h) => h.toLowerCase() === host) && /^\/s\//.test(url.pathname)) {
    return { ok: false, reason: "Short links cannot point to other short links" };
  }
  return { ok: true, url: url.toString() };
}
