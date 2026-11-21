import Link from "next/link";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default function QrNotFound() {
  return (
    <EmptyState icon={QrCode} title="QR code not found" description="It may have been deleted, or it belongs to another account." action={<Button asChild><Link href="/qr-codes">Back to QR codes</Link></Button>} />
  );
}
