import type { MetadataRoute } from "next";
import { getRequestOrigin } from "@/lib/site-url";
import { getPublicFeatures } from "@/services/admin.service";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [baseUrl, explorerEnabled] = await Promise.all([
    getRequestOrigin(),
    getPublicFeatures().then(({ explorerEnabled }) => explorerEnabled).catch(() => true),
  ]);

  return {
    rules: {
      userAgent: "*",
      allow: explorerEnabled ? ["/", "/explorer", "/*"] : ["/", "/*"],
      disallow: explorerEnabled
        ? ["/espace/", "/admin/", "/api/"]
        : ["/explorer", "/espace/", "/admin/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
