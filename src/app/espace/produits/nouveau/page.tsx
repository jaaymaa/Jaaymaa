import { redirect } from "next/navigation";
import { getCurrentSellerContext } from "@/lib/auth";
import { getEffectivePlan, getPhotoLimit } from "@/lib/plans";
import ProductForm from "../ProductForm";

export const metadata = {
  title: "Nouveau Produit - Espace Vendeur",
};

export default async function NouveauProduitPage() {
  const sellerContext = await getCurrentSellerContext();
  if (!sellerContext) redirect("/connexion");
  if (!sellerContext.shop) redirect("/espace/boutique");

  const plan = getEffectivePlan(sellerContext.shop.plan, sellerContext.shop.planExpiresAt);
  return <ProductForm photoLimit={getPhotoLimit(plan)} />;
}
