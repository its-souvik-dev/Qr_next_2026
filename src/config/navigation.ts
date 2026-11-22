import {
  BarChart3,
  LayoutDashboard,
  Link2,
  ListTree,
  PlusSquare,
  QrCode,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { title: string; href: string; icon: LucideIcon; exact?: boolean };

export const dashboardNav: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { title: "QR Codes", href: "/qr-codes", icon: QrCode, exact: true },
  { title: "Create QR Code", href: "/qr-codes/create", icon: PlusSquare },
  { title: "Link Shortener", href: "/links/new", icon: Link2 },
  { title: "My Links", href: "/links", icon: ListTree, exact: true },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const marketingNav = [
  { title: "Free generator", href: "/generate" },
  { title: "Features", href: "/#features" },
  { title: "Pricing", href: "/pricing" },
  { title: "About", href: "/about" },
];
