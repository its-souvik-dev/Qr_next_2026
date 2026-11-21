import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    // Pool size per server instance. Use 1 for single-connection dev databases (e.g. `prisma dev`).
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export { Prisma } from "@/generated/prisma/client";
export type { QRType } from "@/generated/prisma/enums";
