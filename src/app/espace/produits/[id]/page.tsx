import { getCurrentSellerContext } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import ProductForm from "../ProductForm";
import { getProductById } from "@/services/product.service";
import { getEffectivePlan, getPhotoLimit } from "@/lib/plans";

export const metadata = {
  title: "Modifier le produit - Espace Vendeur",
};

export default async function ModifierProduitPage({ params }: { params: Promise<{ id: string }> }) {
  const [sellerContext, { id }] = await Promise.all([
    getCurrentSellerContext(),
    params,
  ]);
  if (!sellerContext) redirect("/connexion");
  const { shop } = sellerContext;
  if (!shop) redirect("/espace/boutique");

  const product = await getProductById(id);
  if (!product || product.shopId !== shop.id) {
    notFound();
  }

  const imageKeys = (product.images ?? [])
    .map((img) => img.url)
    .filter(Boolean);

  const plan = getEffectivePlan(shop.plan, shop.planExpiresAt);
  return <ProductForm product={product} imageKeys={imageKeys} photoLimit={getPhotoLimit(plan)} />;
}
