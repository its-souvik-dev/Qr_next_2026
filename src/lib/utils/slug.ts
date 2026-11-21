const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Random, unambiguous slug (no 0/O/1/l/I). Uses Web Crypto so it works on server and client. */
export function randomSlug(length = 7) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,48}[A-Za-z0-9]$/;

/** Paths that would clash with app routes when served from a custom domain root. */
export const RESERVED_SLUGS = new Set([
  "api", "admin", "dashboard", "login", "register", "settings", "links", "qr-codes", "analytics",
  "pricing", "about", "static", "assets", "_next", "favicon", "robots", "sitemap", "unlock",
]);
