import {
  AppWindow,
  Contact,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Share2,
  Type,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import type { QrContentInput, QrContentType } from "../schemas/content";

export type QrTypeMeta = { type: QrContentType; label: string; description: string; icon: LucideIcon };

export const QR_TYPES: QrTypeMeta[] = [
  { type: "URL", label: "Website", description: "Open a web page", icon: Globe },
  { type: "TEXT", label: "Text", description: "Show plain text", icon: Type },
  { type: "EMAIL", label: "Email", description: "Compose an email", icon: Mail },
  { type: "PHONE", label: "Phone", description: "Call a number", icon: Phone },
  { type: "SMS", label: "SMS", description: "Send a text message", icon: MessageSquare },
  { type: "WIFI", label: "Wi-Fi", description: "Join a network", icon: Wifi },
  { type: "WHATSAPP", label: "WhatsApp", description: "Start a chat", icon: MessageCircle },
  { type: "LOCATION", label: "Location", description: "Open a map", icon: MapPin },
  { type: "VCARD", label: "Contact card", description: "Save a vCard", icon: Contact },
  { type: "SOCIAL", label: "Social", description: "Open a profile", icon: Share2 },
  { type: "APP", label: "App download", description: "Open an app store", icon: AppWindow },
];

export const qrTypeMeta = (type: QrContentType) => QR_TYPES.find((t) => t.type === type) ?? QR_TYPES[0]!;

/** Empty form state for each type. */
export const EMPTY_CONTENT: { [K in QrContentType]: Extract<QrContentInput, { type: K }> } = {
  URL: { type: "URL", url: "" },
  TEXT: { type: "TEXT", text: "" },
  EMAIL: { type: "EMAIL", email: "", subject: "", body: "" },
  PHONE: { type: "PHONE", phone: "" },
  SMS: { type: "SMS", phone: "", message: "" },
  WIFI: { type: "WIFI", ssid: "", password: "", encryption: "WPA", hidden: false },
  WHATSAPP: { type: "WHATSAPP", phone: "", message: "" },
  LOCATION: { type: "LOCATION", mode: "search", query: "", format: "google" },
  VCARD: {
    type: "VCARD",
    firstName: "",
    lastName: "",
    organization: "",
    title: "",
    phone: "",
    mobile: "",
    email: "",
    website: "",
    street: "",
    city: "",
    postalCode: "",
    region: "",
    country: "",
    note: "",
  },
  SOCIAL: { type: "SOCIAL", platform: "instagram", handle: "" },
  APP: { type: "APP", store: "app-store", url: "" },
};
