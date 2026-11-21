import { NextResponse } from "next/server";
import { guardApi, jsonError } from "@/lib/api";
import { linkFormSchema } from "@/features/links/schemas/link";
import { SlugTakenError, deleteLinks, getLink, updateLink, toLinkDTO } from "@/features/links/services/link-service";

export async function GET(_request: Request, ctx: RouteContext<"/api/links/[id]">) {
  const guard = await guardApi();
  if (guard.response) return guard.response;
  const link = await getLink(guard.user.id, (await ctx.params).id);
  return link ? NextResponse.json(link) : jsonError(404, "Not found");
}

/** PATCH /api/links/:id — full update (send the complete link; omit `password` to keep the current one). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/links/[id]">) {
  const guard = await guardApi();
  if (guard.response) return guard.response;
  const body = await request.json().catch(() => null);
  const parsed = linkFormSchema.safeParse({ passwordMode: body?.password ? "set" : body?.password === "" ? "remove" : "keep", ...body });
  if (!parsed.success) return jsonError(400, "Invalid link", { issues: parsed.error.issues });
  try {
    const link = await updateLink(guard.user.id, (await ctx.params).id, parsed.data);
    return link ? NextResponse.json(toLinkDTO(link)) : jsonError(404, "Not found");
  } catch (error) {
    if (error instanceof SlugTakenError) return jsonError(409, error.message);
    throw error;
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/links/[id]">) {
  const guard = await guardApi();
  if (guard.response) return guard.response;
  const count = await deleteLinks(guard.user.id, [(await ctx.params).id]);
  return count ? new NextResponse(null, { status: 204 }) : jsonError(404, "Not found");
}
