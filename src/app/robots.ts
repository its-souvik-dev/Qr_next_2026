import type { MetadataRoute } from "next";
import { appUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/pricing", "/about"], disallow: ["/api/", "/s/", "/dashboard", "/qr-codes", "/links", "/analytics", "/settings"] },
    sitemap: appUrl("/sitemap.xml"),
  };
}
