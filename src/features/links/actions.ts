"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/dal";
import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { checkDestinationUrl } from "@/lib/validations/url";
import { fieldErrors } from "@/lib/validations/form-errors";
import { RESERVED_SLUGS, SLUG_PATTERN } from "@/lib/utils/slug";
import { fail, ok, type ActionResult } from "@/types/actions";
import { bulkLinksSchema, linkFormSchema, type LinkFormInput } from "./schemas/link";
import * as links from "./services/link-service";

const idSchema = z.string().min(1).max(40);

function revalidateLinks(id?: string) {
  revalidatePath("/links");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/links/${id}`);
}

export async function createLinkAction(input: LinkFormInput): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await requireUser();
  if (!rateLimit(`links:${user.id}`, RATE_LIMITS.linkCreate).ok) return fail("You're creating links too quickly. Slow down a little.");
  const parsed = linkFormSchema.safeParse({ ...input, passwordMode: input.passwordMode === "keep" ? "remove" : input.passwordMode });
  if (!parsed.success) return fail("Please fix the highlighted fields", fieldErrors(parsed.error));
  try {
    const link = await links.createLink(user.id, parsed.data);
    revalidateLinks();
    return ok({ id: link.id, slug: link.slug }, "Short link created");
  } catch (error) {
    if (error instanceof links.SlugTakenError) return fail(error.message, { slug: [error.message] });
    throw error;
  }
}

export async function updateLinkAction(id: string, input: LinkFormInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = linkFormSchema.safeParse(input);
  if (!parsed.success) return fail("Please fix the highlighted fields", fieldErrors(parsed.error));
  try {
    const link = await links.updateLink(user.id, idSchema.parse(id), parsed.data);
    if (!link) return fail("Link not found");
    revalidateLinks(id);
    return ok({ id: link.id }, "Link updated");
  } catch (error) {
    if (error instanceof links.SlugTakenError) return fail(error.message, { slug: [error.message] });
    throw error;
  }
}

export async function toggleLinkAction(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await requireUser();
  const updated = await links.setLinkActive(user.id, idSchema.parse(id), z.boolean().parse(isActive));
  if (!updated) return fail("Link not found");
  revalidateLinks(id);
  return ok(undefined, isActive ? "Link enabled" : "Link disabled");
}

export async function deleteLinksAction(ids: string[]): Promise<ActionResult<{ count: number }>> {
  const user = await requireUser();
  const parsed = z.array(idSchema).min(1).max(500).safeParse(ids);
  if (!parsed.success) return fail("Nothing to delete");
  const count = await links.deleteLinks(user.id, parsed.data);
  revalidateLinks();
  return ok({ count }, count === 1 ? "Link deleted" : `${count} links deleted`);
}

export type BulkResult = { created: { slug: string; destinationUrl: string }[]; errors: { line: number; input: string; error: string }[] };

/**
 * Bulk creation. One link per line: `url` or `url,custom-slug` or `url,custom-slug,Title`.
 */
export async function bulkCreateLinksAction(input: z.input<typeof bulkLinksSchema>): Promise<ActionResult<BulkResult>> {
  const user = await requireUser();
  const parsed = bulkLinksSchema.safeParse(input);
  if (!parsed.success) return fail("Please fix the highlighted fields", fieldErrors(parsed.error));

  const lines = parsed.data.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 200) return fail("Up to 200 links per batch");
  if (!rateLimit(`links-bulk:${user.id}`, { limit: 10, windowMs: 60_000 }).ok) return fail("Too many bulk imports. Try again in a minute.");

  const result: BulkResult = { created: [], errors: [] };
  for (const [index, line] of lines.entries()) {
    const [rawUrl = "", rawSlug = "", ...titleParts] = line.split(",").map((p) => p.trim());
    const check = checkDestinationUrl(rawUrl);
    if (!check.ok) {
      result.errors.push({ line: index + 1, input: line, error: check.reason });
      continue;
    }
    if (rawSlug && (!SLUG_PATTERN.test(rawSlug) || RESERVED_SLUGS.has(rawSlug.toLowerCase()))) {
      result.errors.push({ line: index + 1, input: line, error: "Invalid custom slug" });
      continue;
    }
    try {
      const link = await links.createLink(user.id, {
        destinationUrl: check.url,
        slug: rawSlug,
        title: titleParts.join(",").slice(0, 120),
        category: parsed.data.category,
        tags: parsed.data.tags,
        expiresAt: null,
        isActive: true,
        passwordMode: "remove",
        password: "",
        domainId: null,
      });
      result.created.push({ slug: link.slug, destinationUrl: link.destinationUrl });
    } catch (error) {
      result.errors.push({ line: index + 1, input: line, error: error instanceof links.SlugTakenError ? "Slug already taken" : "Couldn't create link" });
    }
  }
  revalidateLinks();
  return ok(result, `Created ${result.created.length} of ${lines.length} links`);
}
