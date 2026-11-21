import "server-only";
import { db } from "@/lib/db";

export async function getSettingsPageData(userId: string) {
  const [user, settings, domains, sessions] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true, createdAt: true } }),
    db.userSettings.upsert({ where: { userId }, create: { userId }, update: {}, select: { analyticsRetentionDays: true, collectCountry: true, collectReferrer: true } }),
    db.customDomain.findMany({ where: { userId }, select: { id: true, hostname: true, verificationToken: true, verifiedAt: true, _count: { select: { links: true } } }, orderBy: { createdAt: "asc" } }),
    db.session.count({ where: { userId, expiresAt: { gt: new Date() } } }),
  ]);
  return { user, settings, domains, sessions };
}
