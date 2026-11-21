import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
  action,
}: {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-[13px]">{label}</Label>
        {action}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
