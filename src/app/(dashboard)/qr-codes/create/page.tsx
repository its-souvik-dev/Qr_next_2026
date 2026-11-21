import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { shortLinkUrl } from "@/config/site";
import { QrStudio } from "@/features/qr/components/studio/qr-studio";
import { listTemplates } from "@/features/qr/services/qr-service";

export const metadata: Metadata = { title: "Create QR code" };

export default async function CreateQrPage(props: PageProps<"/qr-codes/create">) {
  const user = await requireUser();
  const { link: linkParam } = await props.searchParams;
  const linkId = typeof linkParam === "string" ? linkParam.slice(0, 40) : undefined;

  const [templates, link] = await Promise.all([
    listTemplates(user.id),
    linkId
      ? db.shortLink.findFirst({ where: { id: linkId, userId: user.id }, select: { id: true, slug: true, title: true, domain: { select: { hostname: true, verifiedAt: true } } } })
      : null,
  ]);
  const shortUrl = link ? shortLinkUrl(link.slug, link.domain?.verifiedAt ? link.domain.hostname : null) : null;

  return (
    <>
      <PageHeader
        title={link ? "QR code for short link" : "Create QR code"}
        description={
          link
            ? "This code encodes your short link, so you can change where it goes and track scans."
            : "Static QR codes encode your content directly — no redirects, no expiry."
        }
      />
      <QrStudio
        templates={templates}
        lockedContent={shortUrl ?? undefined}
        init={
          link && shortUrl
            ? { content: { type: "URL", url: shortUrl }, shortLinkId: link.id, name: link.title ? `${link.title} QR` : `/${link.slug} QR` }
            : {}
        }
      />
    </>
  );
}
