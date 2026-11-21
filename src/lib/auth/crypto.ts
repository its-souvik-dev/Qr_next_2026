import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";

export { hashSecret, verifySecret } from "./scrypt";
import { hashSecret } from "./scrypt";

/** Opaque random token for cookies / emailed links. */
export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

/** Tokens are stored as SHA-256 so a database leak never exposes usable sessions. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hmac(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

// A precomputed hash used to keep login timing uniform when the user doesn't exist.
let dummyHash: Promise<string> | undefined;
export function getDummyHash() {
  dummyHash ??= hashSecret(randomBytes(16).toString("hex"));
  return dummyHash;
}
