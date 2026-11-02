import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/constants";
import { TOOLS } from "@/lib/tools/registry";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/tools"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/licenses"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ...TOOLS.map((tool) => ({
      url: absoluteUrl(`/tools/${tool.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
