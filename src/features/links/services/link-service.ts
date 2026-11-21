import "server-only";
import { db, Prisma } from "@/lib/db";
import { hashSecret } from "@/lib/auth/crypto";
import { randomSlug } from "@/lib/utils/slug";
import type { LinkFilters, LinkFormValues } from "../schemas/link";

export const linkListSelect = {
  id: true,
  slug: true,
  destinationUrl: true,
  title: true,
  isActive: true,
  expiresAt: true,
  passwordHash: true,
  category: true,
  tags: true,
  clickCount: true,
  lastClickedAt: true,
  createdAt: true,
  domain: { select: { hostname: true, verifiedAt: true } },
} satisfies Prisma.ShortLinkSelect;

type LinkRow = Prisma.ShortLinkGetPayload<{ select: typeof linkListSelect }>;

/** Never send password hashes to the client — expose a boolean instead. */
export function toLinkDTO(row: LinkRow) {
  const { passwordHash, domain, ...rest } = row;
  return {
    ...rest,
    hasPassword: passwordHash !== null,
    hostname: domain?.verifiedAt ? domain.hostname : null,
  };
}
export type LinkDTO = ReturnType<typeof toLinkDTO>;

export class SlugTakenError extends Error {}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function ownedDomainId(userId: string, domainId: string | null | undefined) {
  if (!domainId) return null;
  const domain = await db.customDomain.findFirst({ where: { id: domainId, userId, verifiedAt: { not: null } }, select: { id: true } });
  return domain?.id ?? null;
}

export async function createLink(userId: string, values: LinkFormValues) {
  const base = {
    userId,
    destinationUrl: values.destinationUrl,
    title: values.title || null,
    category: values.category || null,
    tags: [...new Set(values.tags)],
    expiresAt: values.expiresAt ? new Date(values.expiresAt) : null,
    isActive: values.isActive,
    passwordHash: values.passwordMode === "set" ? await hashSecret(values.password) : null,
    domainId: await ownedDomainId(userId, values.domainId),
  };

  if (values.slug) {
    try {
      return await db.shortLink.create({ data: { ...base, slug: values.slug }, select: linkListSelect });
    } catch (error) {
      if (isUniqueViolation(error)) throw new SlugTakenError("That slug is already taken");
      throw error;
    }
  }
  // Random slug: retry on the (very unlikely) collision, growing the length each time.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.shortLink.create({ data: { ...base, slug: randomSlug(7 + attempt) }, select: linkListSelect });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new Error("Could not generate a unique slug");
}

export async function updateLink(userId: string, id: string, values: LinkFormValues) {
  const existing = await db.shortLink.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) return null;
  const domainId = await ownedDomainId(userId, values.domainId);
  const data: Prisma.ShortLinkUpdateInput = {
    destinationUrl: values.destinationUrl,
    title: values.title || null,
    category: values.category || null,
    tags: [...new Set(values.tags)],
    expiresAt: values.expiresAt ? new Date(values.expiresAt) : null,
    isActive: values.isActive,
    domain: domainId ? { connect: { id: domainId } } : { disconnect: true },
  };
  if (values.slug) data.slug = values.slug;
  if (values.passwordMode === "set") data.passwordHash = await hashSecret(values.password);
  if (values.passwordMode === "remove") data.passwordHash = null;
  try {
    return await db.shortLink.update({ where: { id }, data, select: linkListSelect });
  } catch (error) {
    if (isUniqueViolation(error)) throw new SlugTakenError("That slug is already taken");
    throw error;
  }
}

export async function setLinkActive(userId: string, id: string, isActive: boolean) {
  const result = await db.shortLink.updateMany({ where: { id, userId }, data: { isActive } });
  return result.count > 0;
}

export async function deleteLinks(userId: string, ids: string[]) {
  const result = await db.shortLink.deleteMany({ where: { id: { in: ids }, userId } });
  return result.count;
}

function filtersToWhere(userId: string, f: LinkFilters): Prisma.ShortLinkWhereInput {
  const now = new Date();
  const where: Prisma.ShortLinkWhereInput = { userId };
  const and: Prisma.ShortLinkWhereInput[] = [];
  if (f.q) {
    and.push({
      OR: [
        { slug: { contains: f.q, mode: "insensitive" } },
        { destinationUrl: { contains: f.q, mode: "insensitive" } },
        { title: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }
  if (f.category) and.push({ category: f.category });
  if (f.tag) and.push({ tags: { has: f.tag } });
  switch (f.status) {
    case "active":
      and.push({ isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] });
      break;
    case "disabled":
      and.push({ isActive: false });
      break;
    case "expired":
      and.push({ expiresAt: { lte: now } });
      break;
    case "protected":
      and.push({ passwordHash: { not: null } });
      break;
  }
  if (and.length) where.AND = and;
  return where;
}

export async function listLinks(userId: string, filters: LinkFilters, pageSize = 20) {
  const page = filters.page ?? 1;
  const where = filtersToWhere(userId, filters);
  const [rows, total] = await db.$transaction([
    db.shortLink.findMany({ where, select: linkListSelect, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.shortLink.count({ where }),
  ]);
  return { items: rows.map(toLinkDTO), total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function exportLinks(userId: string, filters: LinkFilters) {
  const rows = await db.shortLink.findMany({
    where: filtersToWhere(userId, filters),
    select: linkListSelect,
    orderBy: { createdAt: "desc" },
    take: 50_000,
  });
  return rows.map(toLinkDTO);
}

export async function getLink(userId: string, id: string) {
  const row = await db.shortLink.findFirst({ where: { id, userId }, select: { ...linkListSelect, domainId: true } });
  return row ? { ...toLinkDTO(row), domainId: row.domainId } : null;
}

export async function listLinkFacets(userId: string) {
  const [categories, tagRows] = await Promise.all([
    db.shortLink.findMany({ where: { userId, category: { not: null } }, select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } }),
    db.$queryRaw<{ tag: string }[]>`SELECT DISTINCT unnest("tags") AS tag FROM "ShortLink" WHERE "userId" = ${userId} ORDER BY tag LIMIT 200`,
  ]);
  return { categories: categories.map((c) => c.category!).filter(Boolean), tags: tagRows.map((t) => t.tag) };
}

export async function recentLinks(userId: string, take = 5) {
  const rows = await db.shortLink.findMany({ where: { userId }, select: linkListSelect, orderBy: { createdAt: "desc" }, take });
  return rows.map(toLinkDTO);
}

export async function listVerifiedDomains(userId: string) {
  return db.customDomain.findMany({ where: { userId, verifiedAt: { not: null } }, select: { id: true, hostname: true }, orderBy: { hostname: "asc" } });
}
