"use server";

import { getCurrentSellerContext, getCurrentSellerId } from "@/lib/auth";
import {
  createSubscriptionPaymentIntent,
  getSubscriptionPayment as getSubscriptionPaymentService,
} from "@/services/subscription.service";
import { redirect } from "next/navigation";

export async function startProSubscriptionPayment(formData: FormData): Promise<never> {
  const sellerContext = await getCurrentSellerContext();
  if (!sellerContext || !sellerContext.shop) redirect("/connexion");

  const method = formData.get("method");
  if (method !== "wave" && method !== "orange_money") {
    redirect("/espace/abonnement?erreur=paiement");
  }

  const rawPlan = formData.get("plan");
  const plan = rawPlan === "pro_plus" ? "pro_plus" : "pro";

  let payment: Awaited<ReturnType<typeof createSubscriptionPaymentIntent>>;
  try {
    payment = await createSubscriptionPaymentIntent(
      sellerContext.shop.id,
      method,
      plan,
      sellerContext.sellerId
    );
  } catch {
    redirect("/espace/abonnement?erreur=paiement");
  }

  redirect(payment.paymentUrl);
}

export async function readProSubscriptionPayment(id: string) {
  const sellerId = await getCurrentSellerId();
  if (!sellerId || !id || id.length > 40) return null;

  try {
    return await getSubscriptionPaymentService(id, sellerId);
  } catch {
    return null;
  }
}
