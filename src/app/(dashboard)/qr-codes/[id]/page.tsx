import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/dal";
import { formatDate } from "@/lib/utils";
import { shortLinkUrl } from "@/config/site";
import { QrStudio } from "@/features/qr/components/studio/qr-studio";
import { getQrCode, listTemplates } from "@/features/qr/services/qr-service";
import { qrContentSchema, type QrContentInput } from "@/features/qr/schemas/content";

export const metadata: Metadata = { title: "Edit QR code" };

export default async function EditQrPage(props: PageProps<"/qr-codes/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;
  const [qr, templates] = await Promise.all([getQrCode(user.id, id), listTemplates(user.id)]);
  if (!qr) notFound();

  const content = qrContentSchema.safeParse(qr.payload);
  const lockedContent = qr.shortLink ? shortLinkUrl(qr.shortLink.slug) : undefined;

  return (
    <>
      <PageHeader
        title={qr.name}
        description={`Created ${formatDate(qr.createdAt)} · last updated ${formatDate(qr.updatedAt)}`}
        actions={
          <Button variant="ghost" asChild>
            <Link href="/qr-codes"><ArrowLeft /> All QR codes</Link>
          </Button>
        }
      />
      <QrStudio
        key={qr.id}
        templates={templates}
        lockedContent={lockedContent}
        init={{
          id: qr.id,
          name: qr.name,
          style: qr.config,
          shortLinkId: qr.shortLink?.id ?? null,
          content: content.success ? (qr.payload as QrContentInput) : { type: "TEXT", text: qr.content },
        }}
      />
    </>
  );
}
