"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { cn } from "@/lib/utils";
import { useQrStudio } from "@/stores/qr-studio-store";
import { SOCIAL_PLATFORMS, type QrContentInput, type QrContentType } from "../schemas/content";
import { QR_TYPES } from "../types";
import { useEncodedContent } from "../hooks/use-qr-preview";

type ContentOf<K extends QrContentType> = Extract<QrContentInput, { type: K }>;

/** Binds a field of the active content type to the studio store, with touched-aware errors. */
function useField<K extends QrContentType>(type: K) {
  const content = useQrStudio((s) => s.contents[type]) as ContentOf<K>;
  const update = useQrStudio((s) => s.updateContent);
  const touch = useQrStudio((s) => s.touch);
  const touched = useQrStudio((s) => s.touched);
  const encoded = useEncodedContent();
  const errors = encoded.ok ? {} : encoded.errors;

  return {
    content,
    set: (patch: Partial<ContentOf<K>>) => update(type, patch as never),
    error: (field: string) => (touched[field] || touched.__all ? errors[field] : undefined),
    blur: (field: string) => () => touch(field),
  };
}

export function QrTypeSelector() {
  const type = useQrStudio((s) => s.type);
  const setType = useQrStudio((s) => s.setType);
  return (
    <div role="radiogroup" aria-label="QR code type" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {QR_TYPES.map((t) => {
        const active = t.type === type;
        return (
          <button
            key={t.type}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setType(t.type)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border bg-card p-2.5 text-left transition-all hover:border-foreground/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              active && "border-primary ring-1 ring-primary",
            )}
          >
            <t.icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
            <span className="text-xs font-medium leading-none">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function UrlForm() {
  const { content, set, error, blur } = useField("URL");
  return (
    <FormField label="Website URL" htmlFor="qr-url" error={error("url")} hint="We'll add https:// if you leave it out.">
      <Input id="qr-url" inputMode="url" placeholder="https://example.com" value={content.url} onChange={(e) => set({ url: e.target.value })} onBlur={blur("url")} />
    </FormField>
  );
}

function TextForm() {
  const { content, set, error, blur } = useField("TEXT");
  return (
    <FormField label="Text" htmlFor="qr-text" error={error("text")} hint={`${content.text.length}/2500 characters — shorter text makes a simpler, easier-to-scan code.`}>
      <Textarea id="qr-text" rows={5} value={content.text} onChange={(e) => set({ text: e.target.value })} onBlur={blur("text")} />
    </FormField>
  );
}

function EmailForm() {
  const { content, set, error, blur } = useField("EMAIL");
  return (
    <div className="grid gap-4">
      <FormField label="Email address" htmlFor="qr-email" error={error("email")}>
        <Input id="qr-email" type="email" placeholder="hello@example.com" value={content.email} onChange={(e) => set({ email: e.target.value })} onBlur={blur("email")} />
      </FormField>
      <FormField label="Subject (optional)" htmlFor="qr-subject">
        <Input id="qr-subject" value={content.subject ?? ""} onChange={(e) => set({ subject: e.target.value })} />
      </FormField>
      <FormField label="Message (optional)" htmlFor="qr-body">
        <Textarea id="qr-body" rows={3} value={content.body ?? ""} onChange={(e) => set({ body: e.target.value })} />
      </FormField>
    </div>
  );
}

function PhoneForm() {
  const { content, set, error, blur } = useField("PHONE");
  return (
    <FormField label="Phone number" htmlFor="qr-phone" error={error("phone")} hint="Include the country code, e.g. +1 555 010 2000">
      <Input id="qr-phone" type="tel" placeholder="+1 555 010 2000" value={content.phone} onChange={(e) => set({ phone: e.target.value })} onBlur={blur("phone")} />
    </FormField>
  );
}

function MessageForm({ type }: { type: "SMS" | "WHATSAPP" }) {
  const { content, set, error, blur } = useField(type);
  return (
    <div className="grid gap-4">
      <FormField label="Phone number" htmlFor="qr-msg-phone" error={error("phone")} hint="Include the country code">
        <Input id="qr-msg-phone" type="tel" placeholder="+44 7700 900123" value={content.phone} onChange={(e) => set({ phone: e.target.value } as never)} onBlur={blur("phone")} />
      </FormField>
      <FormField label="Pre-filled message (optional)" htmlFor="qr-msg">
        <Textarea id="qr-msg" rows={3} value={content.message ?? ""} onChange={(e) => set({ message: e.target.value } as never)} />
      </FormField>
    </div>
  );
}

function WifiForm() {
  const { content, set, error, blur } = useField("WIFI");
  return (
    <div className="grid gap-4">
      <Grid>
        <FormField label="Network name (SSID)" htmlFor="qr-ssid" error={error("ssid")}>
          <Input id="qr-ssid" value={content.ssid} onChange={(e) => set({ ssid: e.target.value })} onBlur={blur("ssid")} />
        </FormField>
        <FormField label="Security" htmlFor="qr-enc">
          <Select value={content.encryption} onValueChange={(v) => set({ encryption: v as "WPA" | "WEP" | "nopass" })}>
            <SelectTrigger id="qr-enc" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="WPA">WPA / WPA2 / WPA3</SelectItem>
              <SelectItem value="WEP">WEP (legacy)</SelectItem>
              <SelectItem value="nopass">No password</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </Grid>
      {content.encryption !== "nopass" && (
        <FormField label="Password" htmlFor="qr-wifi-pass" error={error("password")} hint="Stored inside the QR code itself — anyone who scans it can join.">
          <Input id="qr-wifi-pass" value={content.password ?? ""} onChange={(e) => set({ password: e.target.value })} onBlur={blur("password")} autoComplete="off" />
        </FormField>
      )}
      <div className="flex items-center gap-2">
        <Switch id="qr-hidden" checked={content.hidden ?? false} onCheckedChange={(hidden) => set({ hidden })} />
        <Label htmlFor="qr-hidden" className="text-[13px]">Hidden network</Label>
      </div>
    </div>
  );
}

function LocationForm() {
  const { content, set, error, blur } = useField("LOCATION");
  return (
    <div className="grid gap-4">
      <Grid>
        <FormField label="Location by" htmlFor="qr-loc-mode">
          <Select value={content.mode} onValueChange={(v) => set({ mode: v as "coordinates" | "search" })}>
            <SelectTrigger id="qr-loc-mode" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="search">Address or place</SelectItem>
              <SelectItem value="coordinates">Coordinates</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Open with" htmlFor="qr-loc-format">
          <Select value={content.format ?? "google"} onValueChange={(v) => set({ format: v as "google" | "geo" })}>
            <SelectTrigger id="qr-loc-format" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google Maps link (universal)</SelectItem>
              <SelectItem value="geo">geo: URI (native map app)</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </Grid>
      {content.mode === "search" ? (
        <FormField label="Address or place" htmlFor="qr-loc-q" error={error("query")}>
          <Input id="qr-loc-q" placeholder="1600 Amphitheatre Pkwy, Mountain View" value={content.query ?? ""} onChange={(e) => set({ query: e.target.value })} onBlur={blur("query")} />
        </FormField>
      ) : (
        <Grid>
          <FormField label="Latitude" htmlFor="qr-lat" error={error("latitude") ?? error("query")}>
            <Input id="qr-lat" inputMode="decimal" placeholder="37.4220" value={(content.latitude as string | number | undefined) ?? ""} onChange={(e) => set({ latitude: e.target.value === "" ? undefined : e.target.value })} onBlur={blur("query")} />
          </FormField>
          <FormField label="Longitude" htmlFor="qr-lng" error={error("longitude")}>
            <Input id="qr-lng" inputMode="decimal" placeholder="-122.0841" value={(content.longitude as string | number | undefined) ?? ""} onChange={(e) => set({ longitude: e.target.value === "" ? undefined : e.target.value })} onBlur={blur("longitude")} />
          </FormField>
        </Grid>
      )}
    </div>
  );
}

function VCardForm() {
  const { content, set, error, blur } = useField("VCARD");
  const text = (field: keyof Omit<ContentOf<"VCARD">, "type">, label: string, props: Partial<React.ComponentProps<typeof Input>> = {}) => (
    <FormField label={label} htmlFor={`qr-vc-${field}`} error={error(field)}>
      <Input id={`qr-vc-${field}`} value={(content[field] as string | undefined) ?? ""} onChange={(e) => set({ [field]: e.target.value })} onBlur={blur(field)} {...props} />
    </FormField>
  );
  return (
    <div className="grid gap-4">
      <Grid>
        {text("firstName", "First name")}
        {text("lastName", "Last name")}
        {text("organization", "Company")}
        {text("title", "Job title")}
        {text("phone", "Work phone", { type: "tel" })}
        {text("mobile", "Mobile", { type: "tel" })}
        {text("email", "Email", { type: "email" })}
        {text("website", "Website", { inputMode: "url" })}
      </Grid>
      {text("street", "Street")}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {text("city", "City")}
        {text("postalCode", "Postal code")}
        {text("region", "State / region")}
        {text("country", "Country")}
      </div>
      <FormField label="Note" htmlFor="qr-vc-note">
        <Textarea id="qr-vc-note" rows={2} value={content.note ?? ""} onChange={(e) => set({ note: e.target.value })} />
      </FormField>
    </div>
  );
}

function SocialForm() {
  const { content, set, error, blur } = useField("SOCIAL");
  return (
    <Grid>
      <FormField label="Platform" htmlFor="qr-social-platform">
        <Select value={content.platform} onValueChange={(v) => set({ platform: v as keyof typeof SOCIAL_PLATFORMS })}>
          <SelectTrigger id="qr-social-platform" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(SOCIAL_PLATFORMS).map(([id, p]) => (
              <SelectItem key={id} value={id}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Username or profile URL" htmlFor="qr-social-handle" error={error("handle")}>
        <Input id="qr-social-handle" placeholder="@yourname" value={content.handle} onChange={(e) => set({ handle: e.target.value })} onBlur={blur("handle")} />
      </FormField>
    </Grid>
  );
}

function AppForm() {
  const { content, set, error, blur } = useField("APP");
  return (
    <div className="grid gap-4">
      <FormField label="Store" htmlFor="qr-app-store">
        <Select value={content.store} onValueChange={(v) => set({ store: v as "app-store" | "google-play" | "other" })}>
          <SelectTrigger id="qr-app-store" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="app-store">Apple App Store</SelectItem>
            <SelectItem value="google-play">Google Play</SelectItem>
            <SelectItem value="other">Other / website download</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField
        label="App link"
        htmlFor="qr-app-url"
        error={error("url")}
        hint="Static codes open one link. To route iOS and Android users to different stores, create a short link instead."
      >
        <Input id="qr-app-url" inputMode="url" placeholder="https://apps.apple.com/app/id…" value={content.url} onChange={(e) => set({ url: e.target.value })} onBlur={blur("url")} />
      </FormField>
    </div>
  );
}

export function ContentForm() {
  const type = useQrStudio((s) => s.type);
  switch (type) {
    case "URL":
      return <UrlForm />;
    case "TEXT":
      return <TextForm />;
    case "EMAIL":
      return <EmailForm />;
    case "PHONE":
      return <PhoneForm />;
    case "SMS":
      return <MessageForm key="sms" type="SMS" />;
    case "WHATSAPP":
      return <MessageForm key="wa" type="WHATSAPP" />;
    case "WIFI":
      return <WifiForm />;
    case "LOCATION":
      return <LocationForm />;
    case "VCARD":
      return <VCardForm />;
    case "SOCIAL":
      return <SocialForm />;
    case "APP":
      return <AppForm />;
  }
}
