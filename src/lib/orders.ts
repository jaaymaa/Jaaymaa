/**
 * Business logic and helpers for Jaay orders.
 */

export type OrderStatus = "new" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid";
export type PaymentMethod = "wave" | "orange_money" | "cash";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Nouvelle",
  preparing: "En préparation",
  out_for_delivery: "En cours de livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "En attente",
  paid: "Payé",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  cash: "Espèces à la livraison",
};

/**
 * Validates forward-only status transitions according to business rules:
 * - 'new' -> 'preparing' or 'cancelled'
 * - 'preparing' -> 'out_for_delivery' or 'cancelled'
 * - 'out_for_delivery' -> 'delivered' or 'cancelled'
 * - 'delivered' -> no transition allowed (terminal)
 * - 'cancelled' -> no transition allowed (terminal)
 */
export function isValidStatusTransition(
  current: OrderStatus,
  next: OrderStatus
): boolean {
  if (current === next) return false;

  switch (current) {
    case "new":
      return next === "preparing" || next === "cancelled";
    case "preparing":
      return next === "out_for_delivery" || next === "cancelled";
    case "out_for_delivery":
      return next === "delivered" || next === "cancelled";
    case "delivered":
    case "cancelled":
      return false;
    default:
      return false;
  }
}

export function getNextOrderStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case "new":
      return "preparing";
    case "preparing":
      return "out_for_delivery";
    case "out_for_delivery":
      return "delivered";
    default:
      return null;
  }
}

export interface OrderItemCalculationInput {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  optionLabel?: string | null;
}

export interface CalculatedOrderTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}

/**
 * Recalculates order totals strictly on the server.
 * Never trust client calculations.
 */
export function calculateOrderTotals(
  items: Array<{ unitPrice: number; quantity: number }>,
  deliveryFee: number
): CalculatedOrderTotals {
  if (!items || items.length === 0) {
    return {
      subtotal: 0,
      deliveryFee: Math.max(0, Math.round(deliveryFee || 0)),
      total: Math.max(0, Math.round(deliveryFee || 0)),
      itemCount: 0,
    };
  }

  const safeDeliveryFee = Math.max(0, Math.round(deliveryFee || 0));

  let subtotal = 0;
  let itemCount = 0;

  for (const item of items) {
    const qty = Math.max(1, Math.floor(item.quantity || 1));
    const price = Math.max(0, Math.round(item.unitPrice || 0));
    subtotal += price * qty;
    itemCount += qty;
  }

  const total = subtotal + safeDeliveryFee;

  return {
    subtotal,
    deliveryFee: safeDeliveryFee,
    total,
    itemCount,
  };
}

/**
 * Generates an order number in format JY-XXXX.
 * Uses unambiguous characters (no 0, O, 1, I).
 */
export function generateOrderNumber(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  return `JY-${code}`;
}
