"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { LoadingButton } from "@/components/shared/loading-button";
import { bulkCreateLinksAction, type BulkResult } from "@/features/links/actions";
import { shortLinkUrl } from "@/config/site";
import { downloadBlob } from "@/features/qr/services/export-client";
import { TagInput } from "./tag-input";

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function BulkLinkForm({ categories, tags: tagSuggestions }: { categories: string[]; tags: string[] }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [pending, start] = useTransition();
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).length;

  function submit() {
    start(async () => {
      const res = await bulkCreateLinksAction({ text, category, tags });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setResult(res.data);
      toast.success(res.message);
      if (res.data.errors.length === 0) setText("");
    });
  }

  function exportCreated() {
    if (!result) return;
    const rows = ["short_url,destination_url", ...result.created.map((c) => `${csvCell(shortLinkUrl(c.slug))},${csvCell(c.destinationUrl)}`)];
    downloadBlob(new Blob([rows.join("\n")], { type: "text/csv" }), "short-links.csv");
  }

  return (
    <div className="grid gap-5">
      <FormField label="Links" htmlFor="bulk" hint={<>One per line: <code className="font-mono">url</code>, or <code className="font-mono">url,custom-slug,Title</code>. Up to 200 per batch. {lines > 0 && <strong className="text-foreground">{lines} line{lines === 1 ? "" : "s"}</strong>}</>}>
        <Textarea id="bulk" rows={8} className="font-mono text-xs" placeholder={"https://example.com/a\nhttps://example.com/b,spring-sale,Spring sale"} value={text} onChange={(e) => setText(e.target.value)} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Category for all (optional)" htmlFor="bulk-category">
          <Input id="bulk-category" list="bulk-categories" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="bulk-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </FormField>
        <FormField label="Tags for all (optional)" htmlFor="bulk-tags">
          <TagInput id="bulk-tags" value={tags} onChange={setTags} suggestions={tagSuggestions} />
        </FormField>
      </div>
      <div className="flex justify-end">
        <LoadingButton loading={pending} disabled={!lines || lines > 200} onClick={submit}>Create {lines || ""} links</LoadingButton>
      </div>

      {result && (
        <div className="grid gap-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="size-4 text-success" /> {result.created.length} created
              {result.errors.length > 0 && <span className="flex items-center gap-1 text-warning"><AlertTriangle className="size-4" /> {result.errors.length} skipped</span>}
            </div>
            {result.created.length > 0 && <Button variant="outline" size="sm" onClick={exportCreated}><Download /> Download CSV</Button>}
          </div>
          {result.errors.length > 0 && (
            <ul className="grid gap-1 text-xs">
              {result.errors.map((e) => (
                <li key={e.line} className="flex gap-2"><span className="text-muted-foreground">Line {e.line}:</span><span className="truncate font-mono">{e.input}</span><span className="text-destructive">— {e.error}</span></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
