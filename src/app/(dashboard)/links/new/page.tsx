import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { LinkForm } from "@/components/link-shortener/link-form";
import { BulkLinkForm } from "@/components/link-shortener/bulk-link-form";
import { requireUser } from "@/lib/auth/dal";
import { listLinkFacets, listVerifiedDomains } from "@/features/links/services/link-service";

export const metadata: Metadata = { title: "Shorten a link" };

export default async function NewLinkPage() {
  const user = await requireUser();
  const [facets, domains] = await Promise.all([listLinkFacets(user.id), listVerifiedDomains(user.id)]);
  return (
    <>
      <PageHeader title="Link shortener" description="Create short, trackable links. Destinations are validated to keep your links safe." />
      <Tabs defaultValue="single" className="max-w-3xl">
        <TabsList>
          <TabsTrigger value="single">Single link</TabsTrigger>
          <TabsTrigger value="bulk">Bulk create</TabsTrigger>
        </TabsList>
        <TabsContent value="single" className="mt-4 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
          <LinkForm mode="create" categories={facets.categories} tags={facets.tags} domains={domains} />
        </TabsContent>
        <TabsContent value="bulk" className="mt-4 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
          <BulkLinkForm categories={facets.categories} tags={facets.tags} />
        </TabsContent>
      </Tabs>
    </>
  );
}
