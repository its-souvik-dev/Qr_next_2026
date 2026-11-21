import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/*
 * scrypt password hashing. Kept free of "server-only" so scripts (prisma/seed.ts) can use it;
 * app code should import it via ./crypto.
 */

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

function scryptAsync(password: string, salt: Buffer, n = SCRYPT_N, r = SCRYPT_R, p = SCRYPT_P) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LEN, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

/** Hash a secret with scrypt. Format: scrypt$N$r$p$salt$hash (base64url). */
export async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(secret, salt);
  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifySecret(secret: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scryptAsync(secret, Buffer.from(saltB64, "base64url"), Number(n), Number(r), Number(p));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
