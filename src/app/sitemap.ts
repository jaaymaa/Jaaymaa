import type { MetadataRoute } from "next";
import { getRequestOrigin } from "@/lib/site-url";
import { getPublicFeatures } from "@/services/admin.service";
import { listPublicShops } from "@/services/shop.service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getRequestOrigin();

  const explorerEnabled = await getPublicFeatures()
    .then(({ explorerEnabled }) => explorerEnabled)
    .catch(() => true);
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];
  if (explorerEnabled) {
    staticRoutes.push({
      url: `${baseUrl}/explorer`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    });
  }

  try {
    const publishedShops = await listPublicShops();

    const shopRoutes: MetadataRoute.Sitemap = publishedShops.map((shop) => ({
      url: `${baseUrl}/${shop.slug}`,
      lastModified: shop.createdAt ? new Date(shop.createdAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...shopRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticRoutes;
  }
}
