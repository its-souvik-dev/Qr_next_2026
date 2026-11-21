import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

export function LoadingButton({
  loading,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
