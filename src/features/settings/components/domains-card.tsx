"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Globe, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/shared/copy-button";
import { DOMAIN_TXT_PREFIX, DOMAIN_TXT_VALUE_PREFIX } from "@/lib/constants";
import { addDomainAction, removeDomainAction, verifyDomainAction } from "../actions";
import { SettingsCard } from "./settings-card";

type Domain = { id: string; hostname: string; verificationToken: string; verifiedAt: Date | null; _count: { links: number } };

function DnsRow({ type, name, value }: { type: string; name: string; value: string }) {
  return (
    <div className="grid grid-cols-[3rem_1fr] gap-x-3 gap-y-1 rounded-md bg-muted/50 p-2.5 font-mono text-xs sm:grid-cols-[3rem_1fr_1fr]">
      <span className="font-semibold">{type}</span>
      <span className="flex min-w-0 items-center gap-1"><span className="truncate">{name}</span><CopyButton value={name} size="icon-xs" /></span>
      <span className="col-span-2 flex min-w-0 items-center gap-1 sm:col-span-1"><span className="truncate">{value}</span><CopyButton value={value} size="icon-xs" /></span>
    </div>
  );
}

export function DomainsCard({ domains, appHost }: { domains: Domain[]; appHost: string }) {
  const [hostname, setHostname] = useState("");
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: string, fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    setBusy(id);
    const r = await fn();
    setBusy(null);
    if (r.ok) toast.success(r.message);
    else toast.error(r.error);
  }

  return (
    <SettingsCard id="domains" title="Custom domains" description="Serve short links from your own branded domain, e.g. go.yourbrand.com/summer.">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await addDomainAction(hostname);
            if (r.ok) { toast.success(r.message); setHostname(""); } else toast.error(r.error);
          });
        }}
      >
        <Input placeholder="go.yourbrand.com" value={hostname} onChange={(e) => setHostname(e.target.value)} aria-label="Domain" />
        <Button type="submit" variant="secondary" disabled={!hostname || pending}>{pending ? <Loader2 className="animate-spin" /> : <Plus />} Add</Button>
      </form>
      {domains.length > 0 && (
        <ul className="grid gap-3">
          {domains.map((d) => (
            <li key={d.id} className="grid gap-3 rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Globe className="size-4 text-muted-foreground" />
                <span className="font-medium">{d.hostname}</span>
                {d.verifiedAt ? (
                  <Badge variant="outline" className="border-success/30 bg-success/10 text-success"><CheckCircle2 /> Verified</Badge>
                ) : (
                  <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning"><Clock /> Pending DNS</Badge>
                )}
                <span className="text-xs text-muted-foreground">{d._count.links} link{d._count.links === 1 ? "" : "s"}</span>
                <div className="ml-auto flex gap-1">
                  {!d.verifiedAt && (
                    <Button size="sm" variant="outline" disabled={busy === d.id} onClick={() => run(d.id, () => verifyDomainAction(d.id))}>
                      {busy === d.id ? <Loader2 className="animate-spin" /> : <RefreshCw />} Verify
                    </Button>
                  )}
                  <Button size="icon-sm" variant="ghost" aria-label={`Remove ${d.hostname}`} disabled={busy === d.id} onClick={() => run(d.id, () => removeDomainAction(d.id))}><Trash2 /></Button>
                </div>
              </div>
              {!d.verifiedAt && (
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <p>Add these DNS records at your DNS provider, then click Verify:</p>
                  <DnsRow type="TXT" name={`${DOMAIN_TXT_PREFIX}.${d.hostname}`} value={`${DOMAIN_TXT_VALUE_PREFIX}${d.verificationToken}`} />
                  <DnsRow type="CNAME" name={d.hostname} value={appHost} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </SettingsCard>
  );
}
