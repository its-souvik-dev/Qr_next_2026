import { describe, expect, it } from "vitest";
import { checkDestinationUrl } from "./url";
import { safeNextPath } from "./form-errors";

describe("checkDestinationUrl", () => {
  it.each([
    ["https://example.com/a?b=1", "https://example.com/a?b=1"],
    ["example.com/path", "https://example.com/path"],
    ["http://sub.example.co.uk", "http://sub.example.co.uk/"],
  ])("accepts %s", (input, expected) => expect(checkDestinationUrl(input)).toEqual({ ok: true, url: expected }));

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "ftp://example.com/file",
    "https://user:pass@example.com",
    "http://localhost:3000",
    "http://127.0.0.1/admin",
    "http://10.0.0.5",
    "http://192.168.1.1",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/",
    "https://intranet",
    "https://exa mple.com",
  ])("rejects %s", (input) => expect(checkDestinationUrl(input).ok).toBe(false));

  it("rejects links that point to other short links", () => {
    expect(checkDestinationUrl("https://maxqr.app/s/abc", { appHosts: ["maxqr.app"] }).ok).toBe(false);
    expect(checkDestinationUrl("https://maxqr.app/pricing", { appHosts: ["maxqr.app"] }).ok).toBe(true);
  });
});

describe("safeNextPath", () => {
  it.each([
    ["/settings", "/settings"],
    ["/links?status=active", "/links?status=active"],
    ["//evil.com", "/dashboard"],
    ["/\\evil.com", "/dashboard"],
    ["https://evil.com", "/dashboard"],
    [undefined, "/dashboard"],
  ])("%s → %s", (input, expected) => expect(safeNextPath(input)).toBe(expected));
});
