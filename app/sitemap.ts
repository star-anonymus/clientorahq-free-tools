import type { MetadataRoute } from "next";
import { categories, tools } from "@/lib/tools";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(SITE.updated);
  return [
    { url: SITE.url, lastModified, changeFrequency: "weekly", priority: 1 },
    ...categories.map((c) => ({ url: `${SITE.url}/${c.id}-tools`, lastModified, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...tools.map((t) => ({ url: `${SITE.url}/${t.slug}`, lastModified, changeFrequency: "monthly" as const, priority: 0.9 })),
    { url: `${SITE.url}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
