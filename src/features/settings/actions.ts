"use server";

import { resolveTxt } from "node:dns/promises";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { generateToken, hashSecret, hashToken, verifySecret } from "@/lib/auth/crypto";
import { SESSION_COOKIE, destroySession } from "@/lib/auth/session";
import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { changePasswordSchema, profileSchema, type ChangePasswordInput, type ProfileInput } from "@/lib/validations/auth";
import { fieldErrors } from "@/lib/validations/form-errors";
import { fail, ok, type ActionResult } from "@/types/actions";
import { purgeExpiredClicks } from "@/features/analytics/services/analytics-service";
import { DOMAIN_TXT_PREFIX, DOMAIN_TXT_VALUE_PREFIX } from "@/lib/constants";

export async function updateProfileAction(input: ProfileInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fail("Please fix the highlighted fields", fieldErrors(parsed.error));
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  revalidatePath("/", "layout");
  return ok(undefined, "Profile updated");
}

export async function changePasswordAction(input: ChangePasswordInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return fail("Please fix the highlighted fields", fieldErrors(parsed.error));
  if (!rateLimit(`pw:${user.id}`, RATE_LIMITS.login).ok) return fail("Too many attempts. Try again later.");

  const record = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
  if (!(await verifySecret(parsed.data.currentPassword, record.passwordHash))) {
    return fail("Current password is incorrect", { currentPassword: ["Current password is incorrect"] });
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashSecret(parsed.data.newPassword) } });
  // Keep this session, revoke all others.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await db.session.deleteMany({ where: { userId: user.id, ...(token ? { tokenHash: { not: hashToken(token) } } : {}) } });
  return ok(undefined, "Password changed. Other devices were signed out.");
}

export async function signOutOtherSessionsAction(): Promise<ActionResult<{ count: number }>> {
  const user = await requireUser();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const { count } = await db.session.deleteMany({ where: { userId: user.id, ...(token ? { tokenHash: { not: hashToken(token) } } : {}) } });
  return ok({ count }, count ? `Signed out ${count} other session${count === 1 ? "" : "s"}` : "No other active sessions");
}

const privacySchema = z.object({
  analyticsRetentionDays: z.union([z.literal(30), z.literal(90), z.literal(180), z.literal(365), z.literal(730)]),
  collectCountry: z.boolean(),
  collectReferrer: z.boolean(),
});

export async function updatePrivacyAction(input: z.input<typeof privacySchema>): Promise<ActionResult<{ purged: number }>> {
  const user = await requireUser();
  const parsed = privacySchema.safeParse(input);
  if (!parsed.success) return fail("Invalid settings");
  await db.userSettings.upsert({ where: { userId: user.id }, create: { userId: user.id, ...parsed.data }, update: parsed.data });
  // Apply the retention window immediately.
  const purged = await purgeExpiredClicks(user.id);
  revalidatePath("/settings");
  revalidatePath("/analytics");
  return ok({ purged }, purged ? `Settings saved · ${purged} old clicks removed` : "Privacy settings saved");
}

export async function deleteAllAnalyticsAction(): Promise<ActionResult<{ count: number }>> {
  const user = await requireUser();
  const { count } = await db.linkClick.deleteMany({ where: { link: { userId: user.id } } });
  await db.shortLink.updateMany({ where: { userId: user.id }, data: { clickCount: 0, lastClickedAt: null } });
  revalidatePath("/", "layout");
  return ok({ count }, `Deleted ${count} click records`);
}

// --- Custom domains ---------------------------------------------------------------------

const hostnameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(253)
  .regex(/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/, "Enter a domain like go.yourbrand.com");

export async function addDomainAction(hostname: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = hostnameSchema.safeParse(hostname);
  if (!parsed.success) return fail(parsed.error.issues[0]!.message, { hostname: [parsed.error.issues[0]!.message] });
  const appHost = (() => { try { return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").hostname; } catch { return ""; } })();
  if (parsed.data === appHost) return fail("That's the app's own domain");
  if ((await db.customDomain.count({ where: { userId: user.id } })) >= 10) return fail("You can add up to 10 domains");
  const existing = await db.customDomain.findUnique({ where: { hostname: parsed.data }, select: { id: true } });
  if (existing) return fail("This domain is already connected to an account");
  const domain = await db.customDomain.create({
    data: { userId: user.id, hostname: parsed.data, verificationToken: generateToken(18) },
    select: { id: true },
  });
  revalidatePath("/settings");
  return ok({ id: domain.id }, "Domain added — add the DNS records to verify it");
}

export async function verifyDomainAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!rateLimit(`domain-verify:${user.id}`, { limit: 20, windowMs: 60_000 }).ok) return fail("Too many verification attempts");
  const domain = await db.customDomain.findFirst({ where: { id, userId: user.id } });
  if (!domain) return fail("Domain not found");
  let records: string[][] = [];
  try {
    records = await resolveTxt(`${DOMAIN_TXT_PREFIX}.${domain.hostname}`);
  } catch {
    return fail(`No TXT record found at ${DOMAIN_TXT_PREFIX}.${domain.hostname} yet. DNS changes can take a few minutes.`);
  }
  const expected = `${DOMAIN_TXT_VALUE_PREFIX}${domain.verificationToken}`;
  if (!records.some((parts) => parts.join("") === expected)) return fail("TXT record found, but the value doesn't match.");
  await db.customDomain.update({ where: { id }, data: { verifiedAt: new Date() } });
  revalidatePath("/settings");
  return ok(undefined, `${domain.hostname} verified`);
}

export async function removeDomainAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const { count } = await db.customDomain.deleteMany({ where: { id, userId: user.id } });
  if (!count) return fail("Domain not found");
  revalidatePath("/settings");
  return ok(undefined, "Domain removed. Links on it fall back to the default domain.");
}

// --- Account ----------------------------------------------------------------------------

export async function deleteAccountAction(input: { password: string; confirm: string }): Promise<ActionResult> {
  const user = await requireUser();
  if (input.confirm !== "DELETE") return fail("Type DELETE to confirm", { confirm: ["Type DELETE to confirm"] });
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
  if (!(await verifySecret(String(input.password ?? ""), record.passwordHash))) {
    return fail("Password is incorrect", { password: ["Password is incorrect"] });
  }
  await destroySession();
  await db.user.delete({ where: { id: user.id } }); // cascades to all owned data
  redirect("/?account=deleted");
}
