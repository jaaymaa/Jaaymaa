/**
 * WhatsApp utilities for Jaaymaa.
 * Generates wa.me links and pre-filled message templates.
 */

/**
 * Generates a WhatsApp direct link to a phone number.
 * @param phone E.164 number (+221771234567)
 * @param message Optional pre-filled message (URL-encoded automatically)
 */
export function waLink(phone: string, message?: string): string {
  const clean = phone.replace(/\D/g, "");
  const base = `https://wa.me/${clean}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a WhatsApp message for a seller to confirm an order to a customer.
 */
export function orderConfirmationMessage(opts: {
  shopName: string;
  orderNumber: string;
  customerName: string;
  total: number;
}): string {
  return `Salam ${opts.customerName} 👋

Merci pour ta commande chez *${opts.shopName}* !

🧾 *Commande :* ${opts.orderNumber}
💰 *Total :* ${opts.total.toLocaleString("fr-FR").replace(/\s/g, " ")} FCFA

On va te recontacter très bientôt pour les détails de la livraison. 🛵

_Jaaymaa — jaayma.sn_`;
}

/**
 * Generates a WhatsApp message for a seller to promote their shop.
 */
export function shopShareMessage(opts: {
  shopName: string;
  shopUrl: string;
  tagline?: string;
}): string {
  return `Découvre *${opts.shopName}* sur Jaaymaa ! 🛍️${opts.tagline ? `\n_${opts.tagline}_` : ""}

👉 ${opts.shopUrl}

Commande directement en ligne, livraison disponible !`;
}
