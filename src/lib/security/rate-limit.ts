import "server-only";

/**
 * Fixed-window in-memory rate limiter.
 * Suitable for a single instance; swap the store for Redis/Upstash when running multiple instances
 * (the `RateLimitStore` interface is the only thing that needs a new implementation).
 */
export interface RateLimitStore {
  increment(key: string, windowMs: number): { count: number; resetAt: number };
}

class MemoryStore implements RateLimitStore {
  private hits = new Map<string, { count: number; resetAt: number }>();
  private lastSweep = Date.now();

  increment(key: string, windowMs: number) {
    const now = Date.now();
    if (now - this.lastSweep > 60_000) this.sweep(now);
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.hits.set(key, fresh);
      return fresh;
    }
    entry.count += 1;
    return entry;
  }

  private sweep(now: number) {
    this.lastSweep = now;
    for (const [key, entry] of this.hits) if (entry.resetAt <= now) this.hits.delete(key);
  }
}

const globalStore = globalThis as unknown as { __rateLimitStore?: RateLimitStore };
const store: RateLimitStore = (globalStore.__rateLimitStore ??= new MemoryStore());

export type RateLimitRule = { limit: number; windowMs: number };

export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 15 * 60_000 },
  register: { limit: 5, windowMs: 60 * 60_000 },
  passwordReset: { limit: 5, windowMs: 60 * 60_000 },
  linkCreate: { limit: 60, windowMs: 60_000 },
  linkUnlock: { limit: 10, windowMs: 15 * 60_000 },
  redirect: { limit: 300, windowMs: 60_000 },
  upload: { limit: 30, windowMs: 60_000 },
  render: { limit: 60, windowMs: 60_000 },
  mutation: { limit: 120, windowMs: 60_000 },
  api: { limit: 120, windowMs: 60_000 },
} satisfies Record<string, RateLimitRule>;

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

export function rateLimit(key: string, rule: RateLimitRule): RateLimitResult {
  const { count, resetAt } = store.increment(key, rule.windowMs);
  return {
    ok: count <= rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
  };
}
