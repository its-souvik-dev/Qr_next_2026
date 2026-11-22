import type { MetadataRoute } from "next";
import { appUrl } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/generate", "/pricing", "/about", "/login"].map((path) => ({
    url: appUrl(path),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
