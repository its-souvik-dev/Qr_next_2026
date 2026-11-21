"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LoadingButton } from "@/components/shared/loading-button";
import { RETENTION_OPTIONS } from "@/lib/constants";
import { deleteAllAnalyticsAction, updatePrivacyAction } from "../actions";
import { SettingsCard } from "./settings-card";

type Privacy = { analyticsRetentionDays: number; collectCountry: boolean; collectReferrer: boolean };

export function PrivacyForm({ initial }: { initial: Privacy }) {
  const [state, setState] = useState(initial);
  const [pending, start] = useTransition();
  const [deleting, startDelete] = useTransition();
  const dirty = JSON.stringify(state) !== JSON.stringify(initial);

  return (
    <SettingsCard
      id="privacy"
      title="Privacy & analytics"
      description="We never store IP addresses. Visitors are counted with a salted hash that changes every day."
      footer={
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="mr-auto text-destructive hover:text-destructive"><Trash2 /> Delete all analytics</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all click data?</AlertDialogTitle>
                <AlertDialogDescription>All recorded clicks for every link are permanently deleted and counters reset to zero. Links keep working.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" disabled={deleting} onClick={() => startDelete(async () => { const r = await deleteAllAnalyticsAction(); if (r.ok) toast.success(r.message); else toast.error(r.error); })}>
                  Delete data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <LoadingButton size="sm" loading={pending} disabled={!dirty} onClick={() => start(async () => { const r = await updatePrivacyAction(state as never); if (r.ok) toast.success(r.message); else toast.error(r.error); })}>
            Save
          </LoadingButton>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Label className="text-[13px]">Data retention</Label>
            <p className="text-xs text-muted-foreground">Click records older than this are deleted automatically.</p>
          </div>
          <Select value={String(state.analyticsRetentionDays)} onValueChange={(v) => setState((s) => ({ ...s, analyticsRetentionDays: Number(v) }))}>
            <SelectTrigger className="w-40" aria-label="Data retention"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RETENTION_OPTIONS.map((d) => <SelectItem key={d} value={String(d)}>{d >= 365 ? `${d / 365} year${d > 365 ? "s" : ""}` : `${d} days`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="collectCountry" className="text-[13px]">Record visitor country</Label>
            <p className="text-xs text-muted-foreground">From your host&apos;s geo header — no IP lookup.</p>
          </div>
          <Switch id="collectCountry" checked={state.collectCountry} onCheckedChange={(v) => setState((s) => ({ ...s, collectCountry: v }))} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="collectReferrer" className="text-[13px]">Record referrer domain</Label>
            <p className="text-xs text-muted-foreground">Only the domain is kept, never the full URL.</p>
          </div>
          <Switch id="collectReferrer" checked={state.collectReferrer} onCheckedChange={(v) => setState((s) => ({ ...s, collectReferrer: v }))} />
        </div>
      </div>
    </SettingsCard>
  );
}
