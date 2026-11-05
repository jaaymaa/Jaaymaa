import { getCurrentSellerContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import ShopForm from "./ShopForm";
import { getRequestOrigin } from "@/lib/site-url";
import { getEffectivePlan, isPaidPlan } from "@/lib/plans";

export const metadata = {
  title: "Ma Boutique - Espace Vendeur",
};

export default async function BoutiquePage() {
  const [sellerContext, publicOrigin] = await Promise.all([
    getCurrentSellerContext(),
    getRequestOrigin(),
  ]);
  if (!sellerContext) redirect("/connexion");
  const { shop } = sellerContext;
  const canUseMarketingTools = isPaidPlan(getEffectivePlan(shop?.plan, shop?.planExpiresAt));

  return <ShopForm shop={shop || null} publicOrigin={publicOrigin} canUseMarketingTools={canUseMarketingTools} />;
}
