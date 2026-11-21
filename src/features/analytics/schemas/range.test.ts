import { describe, expect, it } from "vitest";
import { parseRange } from "./range";

const NOW = new Date("2026-03-15T10:00:00Z");
const day = (d: Date) => d.toISOString().slice(0, 10);

describe("parseRange", () => {
  it("defaults to the last 30 days, daily", () => {
    const r = parseRange({}, NOW);
    expect(r.preset).toBe("30d");
    expect(r.granularity).toBe("day");
    expect(day(r.to)).toBe("2026-03-16");
    expect((r.to.getTime() - r.from.getTime()) / 86_400_000).toBe(30);
  });
  it("uses monthly buckets for 12 months", () => expect(parseRange({ range: "12m" }, NOW).granularity).toBe("month"));
  it("parses a custom inclusive range", () => {
    const r = parseRange({ range: "custom", from: "2026-01-01", to: "2026-01-31" }, NOW);
    expect(day(r.from)).toBe("2026-01-01");
    expect(day(r.to)).toBe("2026-02-01");
  });
  it("falls back on an inverted custom range", () => expect(parseRange({ range: "custom", from: "2026-02-01", to: "2026-01-01" }, NOW).preset).toBe("30d"));
  it("ignores garbage input", () => expect(parseRange({ range: "lol", g: "hourly" }, NOW).preset).toBe("30d"));
  it("honours explicit granularity", () => expect(parseRange({ range: "7d", g: "week" }, NOW).granularity).toBe("week"));
});
