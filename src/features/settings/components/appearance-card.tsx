"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { SettingsCard } from "./settings-card";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  // false during SSR/hydration, true afterwards — avoids a theme mismatch flash
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  return (
    <SettingsCard id="appearance" title="Appearance" description="Choose how Max QR looks on this device.">
      <div role="radiogroup" aria-label="Theme" className="grid max-w-md grid-cols-3 gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={mounted && theme === o.value}
            onClick={() => setTheme(o.value)}
            className={cn("flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-all hover:bg-accent", mounted && theme === o.value && "border-primary ring-1 ring-primary")}
          >
            <o.icon className="size-4" /> {o.label}
          </button>
        ))}
      </div>
    </SettingsCard>
  );
}
