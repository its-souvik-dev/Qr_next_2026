import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { RATE_LIMITS, rateLimit, type RateLimitRule } from "@/lib/security/rate-limit";
import type { SessionUser } from "@/lib/auth/session";

export function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

type Guarded = { user: SessionUser; response?: never } | { user?: never; response: NextResponse };

/** Authenticate + rate limit an API request. Returns either the user or an error response. */
export async function guardApi(rule: RateLimitRule = RATE_LIMITS.api, bucket = "api"): Promise<Guarded> {
  const user = await getCurrentUser();
  if (!user) return { response: jsonError(401, "Authentication required") };
  const limit = rateLimit(`${bucket}:${user.id}`, rule);
  if (!limit.ok) {
    const response = jsonError(429, "Too many requests");
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return { response };
  }
  return { user };
}
