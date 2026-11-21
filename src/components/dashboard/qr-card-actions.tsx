"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, Download, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteQrCodeAction, duplicateQrCodeAction } from "@/features/qr/actions";

export function QrCardActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon-sm" aria-label={`Actions for ${name}`} className="shadow-sm">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild><Link href={`/qr-codes/${id}`}><Pencil /> Edit</Link></DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            onSelect={() =>
              start(async () => {
                const res = await duplicateQrCodeAction(id);
                if (res.ok) {
                  toast.success(res.message);
                  router.refresh();
                } else toast.error(res.error);
              })
            }
          >
            <Copy /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Download</DropdownMenuLabel>
          {(["png", "svg", "jpeg", "webp"] as const).map((f) => (
            <DropdownMenuItem key={f} asChild>
              <a href={`/api/qr/${id}/image?format=${f}&download=1`} download><Download /> {f === "jpeg" ? "JPG" : f.toUpperCase()}</a>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}><Trash2 /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the QR code from your library. Static codes you&apos;ve already printed or shared keep working — their content is encoded in the image itself.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                start(async () => {
                  const res = await deleteQrCodeAction(id);
                  if (res.ok) toast.success(res.message);
                  else toast.error(res.error);
                  setConfirm(false);
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
