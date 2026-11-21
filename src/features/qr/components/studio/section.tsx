import type { ReactNode } from "react";

export function Section({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="grid gap-3 border-b pb-6 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
