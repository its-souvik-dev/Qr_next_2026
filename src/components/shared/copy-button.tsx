"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label = "Copy",
  showLabel = false,
  className,
  variant = "ghost",
  size,
}: {
  value: string;
  label?: string;
  showLabel?: boolean;
  className?: string;
  variant?: "ghost" | "outline" | "secondary" | "default";
  size?: "sm" | "icon-sm" | "icon-xs" | "default";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size ?? (showLabel ? "sm" : "icon-sm")}
      onClick={copy}
      aria-label={label}
      className={cn(className)}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
      {showLabel && <span>{copied ? "Copied" : label}</span>}
    </Button>
  );
}
