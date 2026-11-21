import "server-only";
import { db, Prisma } from "@/lib/db";
import { parseQrStyle, type QRStyleConfig } from "@/lib/qr/config";
import type { QRType } from "@/generated/prisma/enums";

/**
 * QR code persistence. Every function takes the owner's id and scopes its query to it,
 * so a caller can never read or mutate another user's records.
 */

const listSelect = {
  id: true,
  name: true,
  type: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  shortLink: { select: { id: true, slug: true } },
} satisfies Prisma.QRCodeSelect;

export type QrListItem = Prisma.QRCodeGetPayload<{ select: typeof listSelect }>;

export async function listQrCodes(
  userId: string,
  opts: { query?: string; type?: QRType; page?: number; pageSize?: number } = {},
) {
  const pageSize = opts.pageSize ?? 24;
  const page = Math.max(1, opts.page ?? 1);
  const where: Prisma.QRCodeWhereInput = {
    userId,
    ...(opts.type ? { type: opts.type } : {}),
    ...(opts.query
      ? {
          OR: [
            { name: { contains: opts.query, mode: "insensitive" } },
            { content: { contains: opts.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [items, total] = await db.$transaction([
    db.qRCode.findMany({ where, select: listSelect, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    db.qRCode.count({ where }),
  ]);
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getQrCode(userId: string, id: string) {
  const qr = await db.qRCode.findFirst({
    where: { id, userId },
    select: { ...listSelect, payload: true, config: true },
  });
  if (!qr) return null;
  return { ...qr, config: parseQrStyle(qr.config) };
}

export async function getQrForRender(userId: string, id: string) {
  const qr = await db.qRCode.findFirst({ where: { id, userId }, select: { name: true, content: true, config: true } });
  return qr ? { ...qr, config: parseQrStyle(qr.config) } : null;
}

export async function recentQrCodes(userId: string, take = 6) {
  return db.qRCode.findMany({ where: { userId }, select: listSelect, orderBy: { createdAt: "desc" }, take });
}

type QrWrite = {
  name: string;
  type: QRType;
  payload: Prisma.InputJsonValue;
  content: string;
  config: QRStyleConfig;
  shortLinkId: string | null;
};

export async function createQrCode(userId: string, data: QrWrite) {
  return db.qRCode.create({
    data: { ...data, config: data.config as unknown as Prisma.InputJsonValue, userId },
    select: { id: true },
  });
}

export async function updateQrCode(userId: string, id: string, data: QrWrite) {
  const result = await db.qRCode.updateMany({
    where: { id, userId },
    data: { ...data, config: data.config as unknown as Prisma.InputJsonValue },
  });
  return result.count > 0;
}

export async function deleteQrCode(userId: string, id: string) {
  const result = await db.qRCode.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

export async function duplicateQrCode(userId: string, id: string) {
  const source = await db.qRCode.findFirst({ where: { id, userId } });
  if (!source) return null;
  return db.qRCode.create({
    data: {
      userId,
      name: `${source.name} (copy)`.slice(0, 100),
      type: source.type,
      payload: source.payload as Prisma.InputJsonValue,
      content: source.content,
      config: source.config as Prisma.InputJsonValue,
      shortLinkId: source.shortLinkId,
    },
    select: { id: true },
  });
}

export async function createManyQrCodes(userId: string, rows: Omit<QrWrite, "shortLinkId">[]) {
  return db.qRCode.createMany({
    data: rows.map((r) => ({ ...r, config: r.config as unknown as Prisma.InputJsonValue, userId })),
  });
}

// --- Templates (saved styles) ------------------------------------------------------------

export async function listTemplates(userId: string) {
  const rows = await db.qRTemplate.findMany({
    where: { userId },
    select: { id: true, name: true, config: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((r) => ({ ...r, config: parseQrStyle(r.config) }));
}

export async function upsertTemplate(userId: string, name: string, config: QRStyleConfig) {
  const json = config as unknown as Prisma.InputJsonValue;
  return db.qRTemplate.upsert({
    where: { userId_name: { userId, name } },
    create: { userId, name, config: json },
    update: { config: json },
    select: { id: true },
  });
}

export async function deleteTemplate(userId: string, id: string) {
  const result = await db.qRTemplate.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
