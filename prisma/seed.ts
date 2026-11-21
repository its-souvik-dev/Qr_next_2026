/**
 * Seeds the login account (public sign-up is disabled).
 *   npm run db:seed
 *
 * Creates the user only if it doesn't exist, so re-running never overwrites a password
 * that was later changed in Settings. Override the defaults with SEED_USER_EMAIL /
 * SEED_USER_PASSWORD / SEED_USER_NAME environment variables.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashSecret } from "../src/lib/auth/scrypt";

const email = (process.env.SEED_USER_EMAIL ?? "team.maxwep@gmail.com").trim().toLowerCase();
const password = process.env.SEED_USER_PASSWORD ?? "Team@Max07#";
const name = process.env.SEED_USER_NAME ?? "Team Maxwep";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    console.log(`Seed user ${email} already exists — left unchanged.`);
    return;
  }
  await db.user.create({
    data: { email, name, passwordHash: await hashSecret(password), settings: { create: {} } },
  });
  console.log(`Created seed user ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
