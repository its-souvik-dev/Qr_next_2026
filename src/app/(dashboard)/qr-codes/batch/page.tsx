import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/dal";
import { BatchGenerator } from "@/features/qr/components/batch-generator";
import { listTemplates } from "@/features/qr/services/qr-service";

export const metadata: Metadata = { title: "Batch QR generation" };

export default async function BatchPage() {
  const user = await requireUser();
  const templates = await listTemplates(user.id);
  return (
    <>
      <PageHeader title="Batch generate" description="Create hundreds of static QR codes at once — download them as a ZIP or save them to your library." />
      <BatchGenerator templates={templates} />
    </>
  );
}
