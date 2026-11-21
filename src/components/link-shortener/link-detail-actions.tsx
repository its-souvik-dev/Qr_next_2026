"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { deleteLinksAction, toggleLinkAction } from "@/features/links/actions";

export function LinkDetailActions({ id, isActive, editing }: { id: string; isActive: boolean; editing: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="mr-2 flex items-center gap-2">
        <Switch
          id="link-active"
          checked={isActive}
          disabled={pending}
          onCheckedChange={(v) => start(async () => { const r = await toggleLinkAction(id, v); if (r.ok) toast.success(r.message); else toast.error(r.error); })}
        />
        <Label htmlFor="link-active" className="text-sm">{isActive ? "Enabled" : "Disabled"}</Label>
      </div>
      {!editing && <Button variant="outline" size="sm" asChild><Link href={`/links/${id}?edit=1`} scroll={false}><Pencil /> Edit</Link></Button>}
      <Button variant="outline" size="sm" asChild><Link href={`/qr-codes/create?link=${id}`}><QrCode /> Create QR</Link></Button>
      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirm(true)}><Trash2 /> Delete</Button>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this link?</AlertDialogTitle>
            <AlertDialogDescription>The short URL stops working immediately and its analytics are deleted. QR codes encoding it will no longer resolve.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                start(async () => {
                  const r = await deleteLinksAction([id]);
                  if (r.ok) { toast.success(r.message); router.push("/links"); } else toast.error(r.error);
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
