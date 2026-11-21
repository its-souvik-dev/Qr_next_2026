import Link from "next/link";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default function LinkNotFound() {
  return <EmptyState icon={Link2} title="Link not found" description="It may have been deleted, or it belongs to another account." action={<Button asChild><Link href="/links">Back to links</Link></Button>} />;
}
