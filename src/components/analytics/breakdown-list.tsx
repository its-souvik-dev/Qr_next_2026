import { formatNumber } from "@/lib/utils";

const regionNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

function flag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

export function BreakdownList({ items, kind }: { items: { name: string; value: number }[]; kind?: "country" | "default" }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>;
  return (
    <ul className="grid gap-1.5">
      {items.map((item) => {
        const label = kind === "country" && /^[A-Z]{2}$/.test(item.name) ? `${flag(item.name)}  ${regionNames?.of(item.name) ?? item.name}` : item.name;
        return (
          <li key={item.name} className="relative flex items-center justify-between overflow-hidden rounded-md px-2.5 py-1.5 text-sm">
            <span className="absolute inset-y-0 left-0 rounded-md bg-primary/10" style={{ width: `${(item.value / max) * 100}%` }} />
            <span className="relative truncate pr-2">{label}</span>
            <span className="relative tabular-nums text-muted-foreground">{formatNumber(item.value)}</span>
          </li>
        );
      })}
    </ul>
  );
}
