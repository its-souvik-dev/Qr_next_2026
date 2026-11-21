import { Badge } from "@/components/ui/badge";

export function linkStatus(link: { isActive: boolean; expiresAt: Date | string | null }) {
  if (!link.isActive) return "disabled" as const;
  if (link.expiresAt && new Date(link.expiresAt) <= new Date()) return "expired" as const;
  return "active" as const;
}

export function LinkStatusBadge({ link }: { link: { isActive: boolean; expiresAt: Date | string | null } }) {
  const status = linkStatus(link);
  if (status === "active") return <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Active</Badge>;
  if (status === "expired") return <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">Expired</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Disabled</Badge>;
}
