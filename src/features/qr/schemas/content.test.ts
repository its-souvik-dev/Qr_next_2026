import { describe, expect, it } from "vitest";
import { validateAndEncode } from "./content";

const enc = (input: unknown) => {
  const r = validateAndEncode(input);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.encoded;
};

describe("encodeQrContent", () => {
  it("normalizes URLs", () => expect(enc({ type: "URL", url: "example.com/a" })).toBe("https://example.com/a"));
  it("rejects javascript: URLs", () => expect(validateAndEncode({ type: "URL", url: "javascript:alert(1)" }).ok).toBe(false));
  it("encodes Wi-Fi with escaping", () =>
    expect(enc({ type: "WIFI", ssid: 'My;Net', password: 'p:a"ss', encryption: "WPA", hidden: true })).toBe(
      'WIFI:T:WPA;S:My\\;Net;P:p\\:a\\"ss;H:true;;',
    ));
  it("requires a Wi-Fi password unless open", () =>
    expect(validateAndEncode({ type: "WIFI", ssid: "x", password: "", encryption: "WPA" }).ok).toBe(false));
  it("encodes open Wi-Fi", () => expect(enc({ type: "WIFI", ssid: "Cafe", encryption: "nopass" })).toBe("WIFI:T:nopass;S:Cafe;;"));
  it("encodes mailto", () =>
    expect(enc({ type: "EMAIL", email: "a@b.co", subject: "Hi there", body: "" })).toBe("mailto:a@b.co?subject=Hi%20there"));
  it("encodes SMS", () => expect(enc({ type: "SMS", phone: "+1 (555) 010-2000", message: "Yo" })).toBe("SMSTO:+15550102000:Yo"));
  it("encodes WhatsApp", () =>
    expect(enc({ type: "WHATSAPP", phone: "+44 7700 900123", message: "Hello!" })).toBe("https://wa.me/447700900123?text=Hello!"));
  it("encodes coordinates", () =>
    expect(enc({ type: "LOCATION", mode: "coordinates", latitude: "51.5", longitude: "-0.12", format: "geo" })).toBe("geo:51.5,-0.12"));
  it("encodes social handles", () => expect(enc({ type: "SOCIAL", platform: "github", handle: "@octocat" })).toBe("https://github.com/octocat"));
  it("validates app store host", () =>
    expect(validateAndEncode({ type: "APP", store: "google-play", url: "https://apps.apple.com/app/id1" }).ok).toBe(false));
  it("builds a vCard", () => {
    const v = enc({ type: "VCARD", firstName: "Ada", lastName: "Lovelace", organization: "Analytical, Inc", email: "ada@example.com" });
    expect(v).toContain("BEGIN:VCARD");
    expect(v).toContain("N:Lovelace;Ada;;;");
    expect(v).toContain("ORG:Analytical\\, Inc");
  });
});
