import { z } from "zod";
import { normalizeUrlInput } from "@/lib/validations/url";

/**
 * Static QR content. Every type encodes its real payload directly into the QR symbol,
 * so codes keep working forever without a redirect server or subscription.
 */

const httpUrl = z
  .string()
  .trim()
  .min(1, "Enter a URL")
  .max(2000, "URL is too long")
  .transform(normalizeUrlInput)
  .refine((v) => {
    try {
      const u = new URL(v);
      return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
    } catch {
      return false;
    }
  }, "Enter a valid web address");

const phone = z
  .string()
  .trim()
  .min(3, "Enter a phone number")
  .max(32)
  .regex(/^\+?[0-9 ()./-]{3,}$/, "Use digits, spaces and an optional leading +");

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

export const SOCIAL_PLATFORMS = {
  instagram: { label: "Instagram", base: "https://instagram.com/" },
  facebook: { label: "Facebook", base: "https://facebook.com/" },
  x: { label: "X (Twitter)", base: "https://x.com/" },
  linkedin: { label: "LinkedIn", base: "https://www.linkedin.com/in/" },
  tiktok: { label: "TikTok", base: "https://www.tiktok.com/@" },
  youtube: { label: "YouTube", base: "https://www.youtube.com/@" },
  github: { label: "GitHub", base: "https://github.com/" },
  threads: { label: "Threads", base: "https://www.threads.net/@" },
  pinterest: { label: "Pinterest", base: "https://www.pinterest.com/" },
  snapchat: { label: "Snapchat", base: "https://www.snapchat.com/add/" },
  telegram: { label: "Telegram", base: "https://t.me/" },
} as const;
export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;

export const qrContentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("URL"), url: httpUrl }),
  z.object({ type: z.literal("TEXT"), text: z.string().min(1, "Enter some text").max(2500) }),
  z.object({
    type: z.literal("EMAIL"),
    email: z.email("Enter a valid email address"),
    subject: optionalText(200),
    body: optionalText(1000),
  }),
  z.object({ type: z.literal("PHONE"), phone }),
  z.object({ type: z.literal("SMS"), phone, message: optionalText(500) }),
  z.object({
    type: z.literal("WIFI"),
    ssid: z.string().min(1, "Enter the network name").max(32, "SSIDs are at most 32 characters"),
    password: z.string().max(63).optional().default(""),
    encryption: z.enum(["WPA", "WEP", "nopass"]),
    hidden: z.boolean().default(false),
  }).refine((v) => v.encryption === "nopass" || v.password.length > 0, {
    path: ["password"],
    message: "Enter the network password (or choose “No password”)",
  }),
  z.object({ type: z.literal("WHATSAPP"), phone, message: optionalText(500) }),
  z.object({
    type: z.literal("LOCATION"),
    mode: z.enum(["coordinates", "search"]),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    query: optionalText(300),
    format: z.enum(["google", "geo"]).default("google"),
  }).refine((v) => (v.mode === "coordinates" ? v.latitude !== undefined && v.longitude !== undefined : v.query.length > 0), {
    path: ["query"],
    message: "Enter coordinates or an address",
  }),
  z.object({
    type: z.literal("VCARD"),
    firstName: z.string().trim().min(1, "Enter a first name").max(80),
    lastName: optionalText(80),
    organization: optionalText(120),
    title: optionalText(120),
    phone: optionalText(32),
    mobile: optionalText(32),
    email: z.union([z.literal(""), z.email("Enter a valid email")]).optional().default(""),
    website: optionalText(300),
    street: optionalText(160),
    city: optionalText(80),
    postalCode: optionalText(20),
    region: optionalText(80),
    country: optionalText(80),
    note: optionalText(500),
  }),
  z.object({
    type: z.literal("SOCIAL"),
    platform: z.enum(Object.keys(SOCIAL_PLATFORMS) as [SocialPlatform, ...SocialPlatform[]]),
    handle: z.string().trim().min(1, "Enter a username or profile URL").max(300),
  }),
  z.object({
    type: z.literal("APP"),
    store: z.enum(["app-store", "google-play", "other"]),
    url: httpUrl,
  }).refine(
    (v) =>
      v.store === "other" ||
      (v.store === "app-store" ? /(^|\.)apps\.apple\.com$/i : /(^|\.)play\.google\.com$/i).test(new URL(v.url).hostname),
    { path: ["url"], message: "This doesn't look like a link for the selected store" },
  ),
]);

export type QrContentInput = z.input<typeof qrContentSchema>;
export type QrContent = z.output<typeof qrContentSchema>;
export type QrContentType = QrContent["type"];

// --- Encoding -------------------------------------------------------------------------------

/** Escape special characters for the Wi-Fi QR format (ZXing spec). */
const wifiEscape = (v: string) => v.replace(/([\\;,:"])/g, "\\$1");
/** Escape vCard 3.0 text values. */
const vEsc = (v: string) => v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
const digits = (v: string) => v.replace(/[^0-9+]/g, "");

export function socialProfileUrl(platform: SocialPlatform, handle: string) {
  const trimmed = handle.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return SOCIAL_PLATFORMS[platform].base + trimmed.replace(/^@/, "");
}

/** Build the exact string that will be stored inside the QR symbol. */
export function encodeQrContent(content: QrContent): string {
  switch (content.type) {
    case "URL":
      return content.url;
    case "TEXT":
      return content.text;
    case "EMAIL": {
      const params = new URLSearchParams();
      if (content.subject) params.set("subject", content.subject);
      if (content.body) params.set("body", content.body);
      const qs = params.toString().replace(/\+/g, "%20");
      return `mailto:${content.email}${qs ? `?${qs}` : ""}`;
    }
    case "PHONE":
      return `tel:${digits(content.phone)}`;
    case "SMS":
      return `SMSTO:${digits(content.phone)}:${content.message}`;
    case "WIFI": {
      const parts = [`T:${content.encryption}`, `S:${wifiEscape(content.ssid)}`];
      if (content.encryption !== "nopass") parts.push(`P:${wifiEscape(content.password)}`);
      if (content.hidden) parts.push("H:true");
      return `WIFI:${parts.join(";")};;`;
    }
    case "WHATSAPP": {
      const number = content.phone.replace(/\D/g, "");
      return `https://wa.me/${number}${content.message ? `?text=${encodeURIComponent(content.message)}` : ""}`;
    }
    case "LOCATION": {
      if (content.mode === "coordinates") {
        const lat = content.latitude!;
        const lng = content.longitude!;
        return content.format === "geo"
          ? `geo:${lat},${lng}`
          : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
      return content.format === "geo"
        ? `geo:0,0?q=${encodeURIComponent(content.query)}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.query)}`;
    }
    case "VCARD": {
      const c = content;
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${vEsc(c.lastName)};${vEsc(c.firstName)};;;`,
        `FN:${vEsc([c.firstName, c.lastName].filter(Boolean).join(" "))}`,
      ];
      if (c.organization) lines.push(`ORG:${vEsc(c.organization)}`);
      if (c.title) lines.push(`TITLE:${vEsc(c.title)}`);
      if (c.phone) lines.push(`TEL;TYPE=WORK,VOICE:${digits(c.phone)}`);
      if (c.mobile) lines.push(`TEL;TYPE=CELL:${digits(c.mobile)}`);
      if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${c.email}`);
      if (c.website) lines.push(`URL:${normalizeUrlInput(c.website)}`);
      if (c.street || c.city || c.postalCode || c.region || c.country) {
        lines.push(`ADR;TYPE=WORK:;;${vEsc(c.street)};${vEsc(c.city)};${vEsc(c.region)};${vEsc(c.postalCode)};${vEsc(c.country)}`);
      }
      if (c.note) lines.push(`NOTE:${vEsc(c.note)}`);
      lines.push("END:VCARD");
      return lines.join("\n");
    }
    case "SOCIAL":
      return socialProfileUrl(content.platform, content.handle);
    case "APP":
      return content.url;
  }
}

export type EncodeResult = { ok: true; content: QrContent; encoded: string } | { ok: false; errors: Record<string, string> };

/** Validate raw form input and encode it. Used by the live preview and by the server. */
export function validateAndEncode(input: unknown): EncodeResult {
  const parsed = qrContentSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }
  return { ok: true, content: parsed.data, encoded: encodeQrContent(parsed.data) };
}
