import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "./crypto";

export const SESSION_COOKIE = "mq_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_REFRESH_MS = 24 * 60 * 60 * 1000; // extend at most once a day

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export type SessionUser = { id: string; email: string; name: string };

/** Validates the session cookie against the database. Returns null when absent/expired. */
export async function validateSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  // Sliding expiration, throttled to avoid a write on every request.
  if (session.expiresAt.getTime() - now < SESSION_TTL_MS - SESSION_REFRESH_MS) {
    await db.session
      .update({ where: { id: session.id }, data: { expiresAt: new Date(now + SESSION_TTL_MS) } })
      .catch(() => undefined);
  }
  return session.user;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}
