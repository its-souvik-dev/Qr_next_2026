"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, Download, Lock, MoreHorizontal, Pencil, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CopyButton } from "@/components/shared/copy-button";
import { deleteLinksAction, toggleLinkAction } from "@/features/links/actions";
import { shortLinkUrl } from "@/config/site";
import { formatNumber, formatRelative, hostnameOf } from "@/lib/utils";
import { LinkStatusBadge } from "./link-status";

export type LinkRow = {
  id: string;
  slug: string;
  destinationUrl: string;
  title: string | null;
  isActive: boolean;
  expiresAt: string | null;
  hasPassword: boolean;
  category: string | null;
  tags: string[];
  clickCount: number;
  createdAt: string;
  hostname: string | null;
};

export function LinksTable({ links }: { links: LinkRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [pending, start] = useTransition();
  const params = useSearchParams();

  const allSelected = links.length > 0 && links.every((l) => selected.has(l.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(links.map((l) => l.id)));
  const toggleOne = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  function remove(ids: string[]) {
    start(async () => {
      const res = await deleteLinksAction(ids);
      if (res.ok) {
        toast.success(res.message);
        setSelected(new Set());
      } else toast.error(res.error);
      setConfirm(null);
    });
  }

  function toggle(id: string, active: boolean) {
    start(async () => {
      const res = await toggleLinkAction(id, active);
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  const exportHref = `/api/links/export?${new URLSearchParams([...params.entries()].filter(([k]) => k !== "page")).toString()}`;

  return (
    <div className="grid gap-3">
      <div className="flex min-h-9 items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">{selected.size > 0 ? `${selected.size} selected` : null}</div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setConfirm([...selected])} disabled={pending}>
              <Trash2 /> Delete selected
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <a href={exportHref} download><Download /> Export CSV</a>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5"><Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all links" /></th>
                <th className="px-3 py-2.5 font-medium">Link</th>
                <th className="hidden px-3 py-2.5 font-medium md:table-cell">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">Clicks</th>
                <th className="hidden px-3 py-2.5 font-medium lg:table-cell">Created</th>
                <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Enabled</th>
                <th className="w-10 px-3 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {links.map((link) => {
                const url = shortLinkUrl(link.slug, link.hostname);
                return (
                  <tr key={link.id} className="group transition-colors hover:bg-muted/30" data-state={selected.has(link.id) ? "selected" : undefined}>
                    <td className="px-3 py-3 align-top"><Checkbox checked={selected.has(link.id)} onCheckedChange={() => toggleOne(link.id)} aria-label={`Select ${link.slug}`} /></td>
                    <td className="max-w-0 px-3 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/links/${link.id}`} className="truncate font-mono text-[13px] font-medium hover:underline">{url.replace(/^https?:\/\//, "")}</Link>
                        <CopyButton value={url} size="icon-xs" label="Copy short link" />
                        {link.hasPassword && <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-label="Password protected" />}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {link.title ? <span className="text-foreground/80">{link.title} · </span> : null}
                        <a href={link.destinationUrl} target="_blank" rel="noopener noreferrer nofollow" className="hover:underline">{hostnameOf(link.destinationUrl)}{new URL(link.destinationUrl).pathname !== "/" ? new URL(link.destinationUrl).pathname : ""}</a>
                      </div>
                      {(link.category || link.tags.length > 0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {link.category && <Badge variant="secondary" className="text-[10px]">{link.category}</Badge>}
                          {link.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px] text-muted-foreground">#{t}</Badge>)}
                        </div>
                      )}
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell"><LinkStatusBadge link={link} /></td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(link.clickCount)}</td>
                    <td className="hidden px-3 py-3 whitespace-nowrap text-muted-foreground lg:table-cell">{formatRelative(link.createdAt)}</td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      <Switch checked={link.isActive} onCheckedChange={(v) => toggle(link.id, v)} disabled={pending} aria-label={link.isActive ? "Disable link" : "Enable link"} />
                    </td>
                    <td className="px-3 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${link.slug}`}><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/links/${link.id}`}><BarChart3 /> Analytics</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href={`/links/${link.id}?edit=1`}><Pencil /> Edit</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href={`/qr-codes/create?link=${link.id}`}><QrCode /> Create QR code</Link></DropdownMenuItem>
                          <DropdownMenuItem className="sm:hidden" onSelect={() => toggle(link.id, !link.isActive)}>{link.isActive ? "Disable" : "Enable"}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm([link.id])}><Trash2 /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirm?.length === 1 ? "this link" : `${confirm?.length} links`}?</AlertDialogTitle>
            <AlertDialogDescription>
              The short URL{confirm?.length === 1 ? "" : "s"} will stop working immediately and all click analytics will be removed. QR codes that encode these short links will break. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" disabled={pending} onClick={(e) => { e.preventDefault(); if (confirm) remove(confirm); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
