import { NextResponse } from "next/server";
import { guardApi, jsonError } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { linkFiltersSchema, linkFormSchema } from "@/features/links/schemas/link";
import { SlugTakenError, createLink, listLinks, toLinkDTO } from "@/features/links/services/link-service";
import { shortLinkUrl } from "@/config/site";

/** GET /api/links — list the current user's links (supports q, status, category, tag, page). */
export async function GET(request: Request) {
  const guard = await guardApi();
  if (guard.response) return guard.response;
  const filters = linkFiltersSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  const result = await listLinks(guard.user.id, filters);
  return NextResponse.json({ ...result, items: result.items.map((l) => ({ ...l, shortUrl: shortLinkUrl(l.slug, l.hostname) })) });
}

/** POST /api/links — create a short link. Body matches the link form schema. */
export async function POST(request: Request) {
  const guard = await guardApi(RATE_LIMITS.linkCreate, "links");
  if (guard.response) return guard.response;
  const body = await request.json().catch(() => null);
  const parsed = linkFormSchema.safeParse({ ...body, passwordMode: body?.password ? "set" : "remove" });
  if (!parsed.success) return jsonError(400, "Invalid link", { issues: parsed.error.issues });
  try {
    const link = toLinkDTO(await createLink(guard.user.id, parsed.data));
    return NextResponse.json({ ...link, shortUrl: shortLinkUrl(link.slug, link.hostname) }, { status: 201 });
  } catch (error) {
    if (error instanceof SlugTakenError) return jsonError(409, error.message);
    throw error;
  }
}
