import { z } from "zod";
import { checkDestinationUrl } from "@/lib/validations/url";
import { RESERVED_SLUGS, SLUG_PATTERN } from "@/lib/utils/slug";

export const destinationSchema = z
  .string()
  .trim()
  .min(1, "Enter a destination URL")
  .transform((value, ctx) => {
    const check = checkDestinationUrl(value);
    if (!check.ok) {
      ctx.addIssue({ code: "custom", message: check.reason });
      return z.NEVER;
    }
    return check.url;
  });

export const slugSchema = z
  .string()
  .trim()
  .max(50)
  .refine((v) => v === "" || SLUG_PATTERN.test(v), "4–50 characters: letters, numbers, - and _ (must start and end with a letter or number)")
  .refine((v) => !RESERVED_SLUGS.has(v.toLowerCase()), "This slug is reserved");

const tagSchema = z.string().trim().min(1).max(24).regex(/^[\p{L}\p{N} _-]+$/u, "Tags can contain letters, numbers, spaces, - and _");

export const linkFormSchema = z.object({
  destinationUrl: destinationSchema,
  slug: slugSchema.optional().default(""),
  title: z.string().trim().max(120).optional().default(""),
  category: z.string().trim().max(40).optional().default(""),
  tags: z.array(tagSchema).max(10, "Up to 10 tags").default([]),
  expiresAt: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid date")
    .refine((v) => !v || Date.parse(v) > Date.now(), "Expiration must be in the future"),
  isActive: z.boolean().default(true),
  /** keep = leave as is (edits), set = use `password`, remove = clear protection */
  passwordMode: z.enum(["keep", "set", "remove"]).default("keep"),
  password: z.string().max(128).optional().default(""),
  domainId: z.string().max(40).nullable().optional(),
}).refine((v) => v.passwordMode !== "set" || v.password.length >= 4, {
  path: ["password"],
  message: "Use at least 4 characters",
});

export type LinkFormInput = z.input<typeof linkFormSchema>;
export type LinkFormValues = z.output<typeof linkFormSchema>;

export const bulkLinksSchema = z.object({
  text: z.string().min(1, "Paste at least one URL").max(100_000),
  category: z.string().trim().max(40).optional().default(""),
  tags: z.array(tagSchema).max(10).default([]),
});

export const linkFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  category: z.string().trim().max(40).optional().catch(undefined),
  tag: z.string().trim().max(24).optional().catch(undefined),
  status: z.enum(["all", "active", "disabled", "expired", "protected"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
});
export type LinkFilters = z.infer<typeof linkFiltersSchema>;
