import { getCurrentSellerContext } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getOrderById } from "@/services/order.service";
import OrderDetailView from "./OrderDetailView";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [sellerContext, { orderId }] = await Promise.all([
    getCurrentSellerContext(),
    params,
  ]);
  if (!sellerContext) redirect("/connexion");
  const { shop } = sellerContext;
  if (!shop) redirect("/espace/boutique");

  const order = await getOrderById(orderId, sellerContext.sellerId);
  if (!order || order.shopId !== shop.id) {
    notFound();
  }

  return <OrderDetailView order={order} />;
}
