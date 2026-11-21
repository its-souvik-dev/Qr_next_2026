import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).optional(),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  APP_SECRET: z.string().min(32, "APP_SECRET must be at least 32 characters"),
  CRON_SECRET: z.string().min(16).optional(),
  APP_HOSTNAMES: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

let cached: z.infer<typeof envSchema> | undefined;

/** Validated server environment. Throws a descriptive error on misconfiguration. */
export function env() {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
