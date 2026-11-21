"use client";

import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import type { ReadabilityReport } from "@/lib/qr/analyze";
import { cn } from "@/lib/utils";

const META = {
  good: { icon: CheckCircle2, label: "Excellent scannability", tone: "text-success", bar: "bg-success" },
  warning: { icon: AlertTriangle, label: "Scannable — with caveats", tone: "text-warning", bar: "bg-warning" },
  danger: { icon: OctagonAlert, label: "Hard to scan", tone: "text-destructive", bar: "bg-destructive" },
} as const;

export function Readability({ report, version, ecc }: { report: ReadabilityReport; version: number; ecc: string }) {
  const meta = META[report.level];
  return (
    <div className="grid gap-3" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <div className={cn("flex items-center gap-1.5 text-sm font-medium", meta.tone)}>
          <meta.icon className="size-4" /> {meta.label}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">v{version} · ECC {ecc} · {report.contrast.toFixed(1)}:1</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-500", meta.bar)} style={{ width: `${report.score}%` }} />
      </div>
      {report.issues.length > 0 && (
        <ul className="grid gap-1.5">
          {report.issues.map((issue, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
              {issue.level === "danger" ? (
                <OctagonAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
              ) : (
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
              )}
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
