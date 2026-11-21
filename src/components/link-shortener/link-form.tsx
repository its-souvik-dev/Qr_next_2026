"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dices, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { LoadingButton } from "@/components/shared/loading-button";
import { useActionForm } from "@/features/auth/components/use-action-form";
import { createLinkAction, updateLinkAction } from "@/features/links/actions";
import { linkFormSchema, type LinkFormInput, type LinkFormValues } from "@/features/links/schemas/link";
import { randomSlug } from "@/lib/utils/slug";
import { appUrl } from "@/config/site";
import { TagInput } from "./tag-input";

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type LinkFormProps = {
  mode: "create" | "edit";
  linkId?: string;
  defaults?: Partial<LinkFormInput> & { hasPassword?: boolean };
  categories: string[];
  tags: string[];
  domains: { id: string; hostname: string }[];
  onDone?: (id: string) => void;
};

export function LinkForm({ mode, linkId, defaults, categories, tags, domains, onDone }: LinkFormProps) {
  const router = useRouter();
  const hasPassword = Boolean(defaults?.hasPassword);
  const form = useForm<LinkFormInput, unknown, LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      destinationUrl: defaults?.destinationUrl ?? "",
      slug: defaults?.slug ?? "",
      title: defaults?.title ?? "",
      category: defaults?.category ?? "",
      tags: defaults?.tags ?? [],
      expiresAt: toLocalInput(defaults?.expiresAt),
      isActive: defaults?.isActive ?? true,
      passwordMode: mode === "edit" ? "keep" : "remove",
      password: "",
      domainId: defaults?.domainId ?? null,
    },
  });
  const { errors } = form.formState;
  const [passwordMode, domainId, slug, expiresAt] = useWatch({ control: form.control, name: ["passwordMode", "domainId", "slug", "expiresAt"] });
  const prefix = domainId ? `${domains.find((d) => d.id === domainId)?.hostname}/` : appUrl("/s/").replace(/^https?:\/\//, "");

  const { pending, onSubmit } = useActionForm(
    form as never,
    async (values: LinkFormValues) => {
      const payload = { ...values, expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null };
      return mode === "edit" && linkId ? updateLinkAction(linkId, payload) : createLinkAction(payload);
    },
    {
      onSuccess: (result) => {
        const id = (result.data as { id: string }).id;
        if (onDone) onDone(id);
        else router.push(`/links/${id}`);
      },
    },
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <FormField label="Destination URL" htmlFor="destinationUrl" error={errors.destinationUrl?.message}>
        <Input id="destinationUrl" inputMode="url" placeholder="https://example.com/products/category/product-name" autoFocus={mode === "create"} {...form.register("destinationUrl")} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        {domains.length > 0 && (
          <FormField label="Domain" htmlFor="domainId">
            <Controller
              control={form.control}
              name="domainId"
              render={({ field }) => (
                <Select value={field.value ?? "default"} onValueChange={(v) => field.onChange(v === "default" ? null : v)}>
                  <SelectTrigger id="domainId" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">{appUrl().replace(/^https?:\/\//, "")} (default)</SelectItem>
                    {domains.map((d) => <SelectItem key={d.id} value={d.id}>{d.hostname}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )}
        <FormField
          label="Custom slug"
          htmlFor="slug"
          error={errors.slug?.message}
          hint={mode === "create" ? "Leave empty for a random slug." : "Changing the slug breaks existing printed links."}
          className={domains.length ? "" : "sm:col-span-2"}
        >
          <div className="flex rounded-md shadow-xs">
            <span className="hidden max-w-48 items-center truncate rounded-l-md border border-r-0 bg-muted px-3 font-mono text-xs text-muted-foreground sm:flex">{prefix}</span>
            <Input id="slug" placeholder="summer-sale" className="rounded-none font-mono sm:rounded-none first:rounded-l-md" {...form.register("slug")} />
            <Button type="button" variant="outline" size="icon" className="rounded-l-none border-l-0" aria-label="Generate random slug" onClick={() => form.setValue("slug", randomSlug(), { shouldValidate: true, shouldDirty: true })}>
              <Dices />
            </Button>
          </div>
          {slug && <span className="sr-only">Short link will be {prefix}{slug}</span>}
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Title (optional)" htmlFor="title" error={errors.title?.message}>
          <Input id="title" placeholder="Summer campaign — Instagram" {...form.register("title")} />
        </FormField>
        <FormField label="Category (optional)" htmlFor="category" error={errors.category?.message}>
          <Input id="category" list="category-suggestions" placeholder="Marketing" {...form.register("category")} />
          <datalist id="category-suggestions">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </FormField>
      </div>

      <FormField label="Tags" htmlFor="tags" error={(errors.tags as { message?: string } | undefined)?.message} hint="Press Enter to add a tag.">
        <Controller control={form.control} name="tags" render={({ field }) => <TagInput id="tags" value={field.value ?? []} onChange={field.onChange} suggestions={tags} />} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Expires (optional)" htmlFor="expiresAt" error={errors.expiresAt?.message} hint="After this time visitors see an “expired” page.">
          <div className="flex gap-2">
            <Input id="expiresAt" type="datetime-local" {...form.register("expiresAt")} />
            {expiresAt && (
              <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue("expiresAt", "", { shouldDirty: true })}>Clear</Button>
            )}
          </div>
        </FormField>
        <div className="grid gap-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="protect" className="flex items-center gap-1.5 text-[13px]"><Lock className="size-3.5" /> Password protection</Label>
            <Switch
              id="protect"
              checked={passwordMode === "set" || (passwordMode === "keep" && hasPassword)}
              onCheckedChange={(on) => form.setValue("passwordMode", on ? (hasPassword ? "keep" : "set") : "remove", { shouldDirty: true })}
            />
          </div>
          {passwordMode === "keep" && hasPassword && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              Password is set.
              <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => form.setValue("passwordMode", "set")}>Change</Button>
            </div>
          )}
          {passwordMode === "set" && (
            <FormField label="Password" htmlFor="password" error={errors.password?.message}>
              <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
            </FormField>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="isActive" className="text-[13px]">Link enabled</Label>
          <p className="text-xs text-muted-foreground">Disabled links show a “link disabled” page instead of redirecting.</p>
        </div>
        <Controller control={form.control} name="isActive" render={({ field }) => <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />} />
      </div>

      <div className="flex justify-end gap-2">
        {mode === "edit" && <Button type="button" variant="ghost" onClick={() => (onDone ? onDone(linkId!) : router.back())}>Cancel</Button>}
        <LoadingButton type="submit" loading={pending}>{mode === "create" ? "Create short link" : "Save changes"}</LoadingButton>
      </div>
    </form>
  );
}
