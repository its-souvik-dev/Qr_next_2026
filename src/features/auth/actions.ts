"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDummyHash, generateToken, hashSecret, hashToken, verifySecret } from "@/lib/auth/crypto";
import { createSession, destroyAllSessions, destroySession } from "@/lib/auth/session";
import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import { sendMail } from "@/lib/mail";
import { SIGNUP_ENABLED, appUrl } from "@/config/site";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { fieldErrors, safeNextPath } from "@/lib/validations/form-errors";
import { fail, ok, type ActionResult } from "@/types/actions";

const RESET_TTL_MS = 60 * 60 * 1000;

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  // Sign-up is disabled: reject direct calls to this action even though the form is hidden.
  if (!SIGNUP_ENABLED) return fail("Sign-up is currently disabled. Please sign in.");
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return fail("Please fix the highlighted fields", fieldErrors(parsed.error));

  const ip = await getClientIp();
  if (!rateLimit(`register:${ip}`, RATE_LIMITS.register).ok) {
    return fail("Too many sign-up attempts. Please try again later.");
  }

  const { name, email, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return fail("An account with this email already exists", { email: ["Email is already registered"] });

  const user = await db.user.create({
    data: { name, email, passwordHash: await hashSecret(password), settings: { create: {} } },
    select: { id: true },
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(input: LoginInput & { next?: string }): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fail("Please fix the highlighted fields", fieldErrors(parsed.error));

  const { email, password } = parsed.data;
  const ip = await getClientIp();
  const limit = rateLimit(`login:${ip}:${email}`, RATE_LIMITS.login);
  if (!limit.ok) return fail(`Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`);

  const user = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  // Always run a hash comparison so response time doesn't reveal whether the account exists.
  const valid = await verifySecret(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid) return fail("Incorrect email or password");

  await createSession(user.id);
  redirect(safeNextPath(input.next));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function requestPasswordResetAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return fail("Enter a valid email address", fieldErrors(parsed.error));

  const ip = await getClientIp();
  if (!rateLimit(`reset:${ip}`, RATE_LIMITS.passwordReset).ok) {
    return fail("Too many requests. Please try again later.");
  }

  const genericMessage = "If an account exists for that email, a reset link is on its way.";
  const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, email: true } });
  if (!user) return ok(undefined, genericMessage);

  const token = generateToken();
  await db.$transaction([
    db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    }),
  ]);
  await sendMail({
    to: user.email,
    subject: "Reset your Max QR password",
    text: `Use this link to choose a new password (valid for 1 hour):\n${appUrl(`/reset-password?token=${token}`)}\n\nIf you didn't request this, you can ignore this email.`,
  });
  return ok(undefined, genericMessage);
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fail("Please fix the highlighted fields", fieldErrors(parsed.error));

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return fail("This reset link is invalid or has expired. Request a new one.");
  }

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashSecret(parsed.data.password) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await destroyAllSessions(record.userId);
  await createSession(record.userId);
  redirect("/dashboard");
}
