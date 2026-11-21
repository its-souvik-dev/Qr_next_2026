import { z } from "zod";
import { qrStyleSchema } from "@/lib/qr/config";

export const saveQrSchema = z.object({
  id: z.string().min(1).max(40).optional(),
  name: z.string().trim().min(1, "Give your QR code a name").max(100),
  content: z.unknown(),
  config: qrStyleSchema,
  shortLinkId: z.string().min(1).max(40).nullable().optional(),
});
export type SaveQrInput = z.input<typeof saveQrSchema>;

export const templateSchema = z.object({
  name: z.string().trim().min(1, "Name your style").max(60),
  config: qrStyleSchema,
});

export const renderRequestSchema = z.object({
  content: z.string().min(1).max(4296),
  config: qrStyleSchema,
  format: z.enum(["png", "jpeg", "webp", "svg"]),
  size: z.number().int().min(64).max(8000),
  dpi: z.number().int().min(72).max(1200).default(300),
  transparent: z.boolean().default(false),
  quality: z.number().int().min(40).max(100).default(92),
});
export type RenderRequest = z.input<typeof renderRequestSchema>;
