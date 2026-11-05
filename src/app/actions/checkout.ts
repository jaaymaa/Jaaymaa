"use server";

import { normalizePhone } from "@/lib/phone";
import { createOrder as createOrderService } from "@/services/order.service";
import { sendOrderPushNotification } from "@/services/notification.service";

type CheckoutItemInput = {
  productId: string;
  quantity: number;
  options?: string | null;
  optionLabel?: string | null;
};

type CheckoutData = {
  shopId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  note?: string;
  paymentMethod: "wave" | "orange_money" | "cash";
  items: CheckoutItemInput[];
  honeypot?: string;
};

export async function createOrder(data: CheckoutData) {
  // Protection anti-bot honeypot
  if (data.honeypot && data.honeypot.trim().length > 0) {
    return { error: "Requête refusée." };
  }

  if (!data.items || data.items.length === 0) {
    return { error: "Votre panier est vide." };
  }

  if (data.items.length > 20) {
    return { error: "Une commande ne peut pas dépasser 20 articles différents." };
  }

  const cleanName = data.customerName?.trim();
  const cleanAddress = data.customerAddress?.trim();

  if (!cleanName || !data.customerPhone || !cleanAddress) {
    return { error: "Veuillez remplir toutes les informations de livraison obligatoires." };
  }

  const phone = normalizePhone(data.customerPhone);
  if (!phone) {
    return { error: "Le numéro de téléphone n'est pas un numéro valide." };
  }

  try {
    const order = await createOrderService({
      shopId: data.shopId,
      customerName: cleanName,
      customerPhone: phone,
      deliveryAddress: cleanAddress,
      note: data.note?.trim() || undefined,
      paymentMethod: data.paymentMethod,
      items: data.items.map((i) => ({
        productId: i.productId,
        quantity: Math.max(1, Math.min(50, Math.floor(i.quantity || 1))),
        options: i.options || i.optionLabel || null,
      })),
    });

    if (order.shop?.ownerId) {
      await sendOrderPushNotification(order.shop.ownerId, order.id);
    }

    return {
      success: true,
      publicToken: order.publicToken || order.reference,
      reference: order.reference,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la commande.";
    return { error: msg };
  }
}
