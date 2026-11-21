"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { qrStyleSchema } from "@/lib/qr/config";
import { QrContentError, createMatrix, resolveEcc } from "@/lib/qr/matrix";
import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { fieldErrors } from "@/lib/validations/form-errors";
import { fail, ok, type ActionResult } from "@/types/actions";
import { validateAndEncode } from "./schemas/content";
import { saveQrSchema, templateSchema, type SaveQrInput } from "./schemas/save";
import * as qrService from "./services/qr-service";

async function guard(userId: string) {
  if (!rateLimit(`mutation:${userId}`, RATE_LIMITS.mutation).ok) throw new Error("rate");
}

export async function saveQrCodeAction(input: SaveQrInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  try {
    await guard(user.id);
  } catch {
    return fail("You're doing that too fast. Please wait a moment.");
  }

  const parsed = saveQrSchema.safeParse(input);
  if (!parsed.success) return fail("Please check your QR code settings", fieldErrors(parsed.error));
  const encoded = validateAndEncode(parsed.data.content);
  if (!encoded.ok) return fail(Object.values(encoded.errors)[0] ?? "Invalid QR content");

  try {
    createMatrix(encoded.encoded, resolveEcc(parsed.data.config));
  } catch (error) {
    return fail(error instanceof QrContentError ? error.message : "This content can't be encoded");
  }

  let shortLinkId: string | null = null;
  if (parsed.data.shortLinkId) {
    const link = await db.shortLink.findFirst({ where: { id: parsed.data.shortLinkId, userId: user.id }, select: { id: true } });
    if (!link) return fail("Short link not found");
    shortLinkId = link.id;
  }

  const data = {
    name: parsed.data.name,
    type: encoded.content.type,
    payload: encoded.content,
    content: encoded.encoded,
    config: parsed.data.config,
    shortLinkId,
  };

  if (parsed.data.id) {
    const updated = await qrService.updateQrCode(user.id, parsed.data.id, data);
    if (!updated) return fail("QR code not found");
    return ok({ id: parsed.data.id }, "QR code saved");
  }
  // No revalidatePath here: it would refresh (and remount) the open studio. Library pages are
  // dynamic and always fetch fresh data on navigation.
  const created = await qrService.createQrCode(user.id, data);
  return ok({ id: created.id }, "QR code saved");
}

export async function deleteQrCodeAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const deleted = await qrService.deleteQrCode(user.id, z.string().max(40).parse(id));
  if (!deleted) return fail("QR code not found");
  revalidatePath("/qr-codes");
  revalidatePath("/dashboard");
  return ok(undefined, "QR code deleted");
}

export async function duplicateQrCodeAction(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const copy = await qrService.duplicateQrCode(user.id, z.string().max(40).parse(id));
  if (!copy) return fail("QR code not found");
  revalidatePath("/qr-codes");
  return ok({ id: copy.id }, "QR code duplicated");
}

const batchSchema = z.object({
  rows: z
    .array(z.object({ name: z.string().trim().min(1).max(100), value: z.string().min(1).max(2000) }))
    .min(1)
    .max(500),
  config: qrStyleSchema,
});

/** Save many static QR codes at once (URL or plain text, detected per row). */
export async function saveBatchAction(input: z.input<typeof batchSchema>): Promise<ActionResult<{ count: number }>> {
  const user = await requireUser();
  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid batch — up to 500 rows of name and content");

  const rows = [];
  for (const row of parsed.data.rows) {
    const asUrl = validateAndEncode({ type: "URL", url: row.value });
    const isUrl = asUrl.ok && /^(https?:\/\/|www\.)/i.test(row.value.trim());
    const result = isUrl ? asUrl : validateAndEncode({ type: "TEXT", text: row.value });
    if (!result.ok) return fail(`Row “${row.name}” is invalid`);
    rows.push({ name: row.name, type: result.content.type, payload: result.content, content: result.encoded, config: parsed.data.config });
  }
  const created = await qrService.createManyQrCodes(user.id, rows);
  revalidatePath("/qr-codes");
  return ok({ count: created.count }, `Saved ${created.count} QR codes`);
}

export async function saveTemplateAction(input: z.input<typeof templateSchema>): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return fail("Please name your style", fieldErrors(parsed.error));
  const count = await db.qRTemplate.count({ where: { userId: user.id } });
  if (count >= 100) return fail("You can save up to 100 styles");
  // Saved styles keep the logo; the embedded image is already sanitized.
  const template = await qrService.upsertTemplate(user.id, parsed.data.name, parsed.data.config);
  return ok({ id: template.id }, "Style saved");
}

export async function deleteTemplateAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const deleted = await qrService.deleteTemplate(user.id, z.string().max(40).parse(id));
  if (!deleted) return fail("Style not found");
  return ok(undefined, "Style deleted");
}

