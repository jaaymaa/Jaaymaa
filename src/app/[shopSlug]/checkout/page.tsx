import { notFound } from "next/navigation";
import { getShopBySlug } from "@/services/shop.service";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);

  if (!shop || !shop.isPublished) notFound();

  return (
    <CheckoutClient
      shopSlug={shop.slug}
      shop={{
        id: shop.id,
        name: shop.name,
        deliveryFee: shop.deliveryFee,
        deliveryZones: shop.deliveryZones ?? [],
      }}
    />
  );
}
