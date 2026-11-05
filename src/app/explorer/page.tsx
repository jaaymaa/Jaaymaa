import { getPublicFeatures } from "@/services/admin.service";
import { exploreProducts } from "@/services/product.service";
import { exploreShops } from "@/services/shop.service";
import { redirect } from "next/navigation";
import ExplorerFeed from "./ExplorerFeed";

export const metadata = {
  title: "Explorer les produits sénégalais | Jaaymaa",
  description: "Découvrez des produits vendus par des commerçants et créateurs sénégalais.",
};

// Cache les résultats 30s côté Next.js
export const revalidate = 30;

const ITEMS_PER_PAGE = 20;

export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string; view?: string }>;
}) {
  const explorerEnabled = await getPublicFeatures()
    .then(({ explorerEnabled }) => explorerEnabled)
    .catch(() => true);
  if (!explorerEnabled) redirect("/");

  const params = await searchParams;
  const query = params.q?.trim() || "";
  const selectedCategory = params.cat && params.cat !== "Tous" ? params.cat : "";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const initialView = params.view === "shops" ? "shops" : "products";
  const [productResults, shopResults] = await Promise.all([
    initialView === "products"
      ? exploreProducts({ q: query, category: selectedCategory, page: currentPage, limit: ITEMS_PER_PAGE })
      : Promise.resolve({ items: [], hasNextPage: false }),
    initialView === "shops"
      ? exploreShops({ q: query, category: selectedCategory, page: currentPage, limit: 12 })
      : Promise.resolve({ items: [], hasNextPage: false }),
  ]);

  return (
    <ExplorerFeed
      initialProducts={productResults.items}
      initialCategory={selectedCategory || "Tous"}
      initialQuery={query}
      initialPage={currentPage}
      initialHasNextPage={initialView === "products" ? productResults.hasNextPage : shopResults.hasNextPage}
      initialShops={shopResults.items}
      initialView={initialView}
    />
  );
}
