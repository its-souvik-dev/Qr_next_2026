import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingsCard({ title, description, children, footer, danger, id }: { title: string; description?: string; children: ReactNode; footer?: ReactNode; danger?: boolean; id?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-20 overflow-hidden rounded-xl border bg-card shadow-xs", danger && "border-destructive/40")}>
      <div className="grid gap-4 p-4 sm:p-6">
        <div>
          <h2 className={cn("text-base font-semibold", danger && "text-destructive")}>{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
      {footer && <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-4 py-3 sm:px-6">{footer}</div>}
    </section>
  );
}
