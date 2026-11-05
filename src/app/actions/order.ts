"use server";

import { getCurrentSellerId } from "@/lib/auth";
import { revalidatePath, updateTag } from "next/cache";
import { updateOrderStatus as updateOrderStatusService } from "@/services/order.service";
import type { OrderStatus, PaymentStatus } from "@/lib/orders";

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
  const sellerId = await getCurrentSellerId();
  if (!sellerId) return { error: "Non autorisé." };

  try {
    await updateOrderStatusService(orderId, sellerId, nextStatus.toUpperCase());
    updateTag("orders");
    revalidatePath("/espace/commandes");
    revalidatePath("/espace");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Une erreur est survenue.";
    return { error: msg };
  }
}

export async function updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
  const sellerId = await getCurrentSellerId();
  if (!sellerId) return { error: "Non autorisé." };

  try {
    await updateOrderStatusService(orderId, sellerId, undefined, paymentStatus);
    updateTag("orders");
    revalidatePath("/espace/commandes");
    revalidatePath("/espace");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Une erreur est survenue.";
    return { error: msg };
  }
}
