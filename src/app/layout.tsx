import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — QR Code Generator & Link Shortener`, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ["QR code generator", "static QR code", "QR code with logo", "URL shortener", "link analytics"],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — QR Code Generator & Link Shortener`,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh">
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster richColors closeButton position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
