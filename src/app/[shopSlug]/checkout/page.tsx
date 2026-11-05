"use client";

import { useCartStore } from "@/lib/cart-store";
import { formatFcfa } from "@/lib/money";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { createOrder } from "../../actions/checkout";
import { Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { trackAnalyticsEvent } from "@/lib/analytics";

/* ─── Ticket shape (haut du reçu) ─── */
function TicketShape({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Dents de scie en haut (inversées) */}
      <svg
        viewBox="0 0 344 18"
        preserveAspectRatio="none"
        style={{ width: "100%", height: 18, display: "block" }}
      >
        <path
          d="M0 18H344V0L334.6 9L325.1 0L315.7 9L306.3 0L296.9 9L287.4 0L278.0 9L268.6 0L259.1 9L249.7 0L240.3 9L230.9 0L221.4 9L212.0 0L202.6 9L193.1 0L183.7 9L174.3 0L164.9 9L155.4 0L146.0 9L136.6 0L127.1 9L117.7 0L108.3 9L98.9 0L89.4 9L80.0 0L70.6 9L61.1 0L51.7 9L42.3 0L32.9 9L23.4 0L14.0 9L4.6 0L0 9Z"
          fill="#FFFBF2"
          stroke="#0F1E3D"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div style={{ backgroundColor: "#FFFBF2" }}>{children}</div>
      {/* Dents de scie en bas */}
      <svg
        viewBox="0 0 344 18"
        preserveAspectRatio="none"
        style={{ width: "100%", height: 18, display: "block" }}
      >
        <path
          d="M0 0H344V18L334.6 9L325.1 18L315.7 9L306.3 18L296.9 9L287.4 18L278.0 9L268.6 18L259.1 9L249.7 18L240.3 9L230.9 18L221.4 9L212.0 18L202.6 9L193.1 18L183.7 9L174.3 18L164.9 9L155.4 18L146.0 9L136.6 18L127.1 9L117.7 18L108.3 9L98.9 18L89.4 9L80.0 18L70.6 9L61.1 18L51.7 9L42.3 18L32.9 9L23.4 18L14.0 9L4.6 18L0 9Z"
          fill="#FFFBF2"
          stroke="#0F1E3D"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

/* ─── Divider pointillé ─── */
function DottedDivider() {
  return (
    <div className="my-3" style={{ borderTop: "1.5px dashed rgba(91,103,133,0.4)" }} />
  );
}

const PAYMENT_METHODS = [
  { value: "wave",         label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "cash",         label: "Espèces" },
];

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = use(params);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, shopId, getCartTotal, removeItem, clearCart } = useCartStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wave");
  const [checkoutTracked, setCheckoutTracked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !items.length || checkoutTracked) return;
    trackAnalyticsEvent("begin_checkout", {
      currency: "XOF",
      value: getCartTotal(),
      items: items.map(({ product, quantity }) => ({
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity,
      })),
    });
    setCheckoutTracked(true);
  }, [checkoutTracked, getCartTotal, items, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ backgroundColor: "#0A1530" }} aria-busy="true">
        <JaaymaLoader variant="main" size={144} label="Préparation du panier" />
        <p className="font-bricolage text-sm font-black text-white">Préparation de ton panier…</p>
      </div>
    );
  }

  // Ne pas afficher l'écran vide si on est en train de rediriger vers la confirmation
  if (items.length === 0 && !isSubmitting && !isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: "#0A1530" }}>
        <p className="font-bricolage font-black text-white text-2xl mb-3">Panier vide</p>
        <Link href={`/${shopSlug}`} className="px-6 py-3 rounded-full font-bold text-sm border-[2px] border-sun" style={{ backgroundColor: "#FFC83D", color: "#0F1E3D" }}>
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const subtotal = getCartTotal();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      shopId: shopId!,
      customerName: formData.get("name") as string,
      customerPhone: formData.get("phone") as string,
      customerAddress: formData.get("address") as string,
      note: formData.get("note") as string,
      paymentMethod: paymentMethod as "wave" | "orange_money" | "cash",
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        options: item.optionsString || null,
      })),
      honeypot: (formData.get("website") as string) || "",
    };

    const res = await createOrder(data);
    if (res.error) {
      setError(res.error);
      setIsSubmitting(false);
    } else if (res.success && res.publicToken) {
      trackAnalyticsEvent("purchase", {
        transaction_id: res.publicToken,
        currency: "XOF",
        value: subtotal,
        items: items.map(({ product, quantity }) => ({
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity,
        })),
      });
      // Naviguer d'abord, puis vider le panier pour éviter le flash "Panier vide"
      setIsRedirecting(true);
      router.push(`/${shopSlug}/commande/${res.publicToken}`);
      clearCart();
    }
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: "#0A1530" }}>
      {/* ─── HEADER ─── */}
      <div className="px-5 pt-5 max-w-xl mx-auto">
        {/* Retour */}
        <Link href={`/${shopSlug}`} className="inline-flex items-center gap-1.5 text-sm font-medium mb-6" style={{ color: "#C3CCE6" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Retour
        </Link>

        <h1 className="font-bricolage font-black text-white mb-1" style={{ fontSize: "clamp(1.8rem, 7vw, 2.5rem)", letterSpacing: "-0.02em" }}>
          Ta commande
        </h1>
        <p className="text-sm mb-6" style={{ color: "#C3CCE6" }}>Vérifie tout avant de confirmer.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        {/* ─── TICKET RÉCAPITULATIF ─── */}
        <div className="px-4 max-w-xl mx-auto mb-5">
          <TicketShape>
            <div className="px-5 py-4">
              {/* Logo boutique */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "#FFC83D" }}>
                    <svg width="12" height="12" viewBox="0 0 120 120" fill="none">
                      <path d="M38 4H82A34 34 0 0 1 116 38V82A34 34 0 0 1 82 116H10A6 6 0 0 1 4 110V38A34 34 0 0 1 38 4Z" fill="#FFC83D" />
                      <path d="M64 46V76C64 90 57 97 44 97" stroke="#0F1E3D" strokeWidth="12" strokeLinecap="round" fill="none" />
                      <circle cx="64" cy="28" r="7.5" fill="#C8265A" />
                    </svg>
                  </div>
                  <span className="font-bricolage font-black text-ink text-sm">
                    {shopSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
                <span className="text-xs font-semibold" style={{ color: "#3F4B69" }}>#JY-{Math.floor(Math.random() * 9000 + 1000)}</span>
              </div>

              <DottedDivider />

              {/* Articles */}
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-ink">Articles</p>
                <button
                  type="button"
                  onClick={() => setShowClearCartModal(true)}
                  className="text-xs font-bold underline underline-offset-2"
                  style={{ color: "#C8265A" }}
                >
                  Vider le panier
                </button>
              </div>
              {items.map((item) => {
                const itemKey = `${item.product.id}-${item.optionsString || ""}`;
                return (
                  <div key={itemKey}>
                    <div className="flex items-start justify-between py-1.5">
                      <div>
                        <p className="text-sm font-bold text-ink">{item.product.name}</p>
                        {item.optionsString && (
                          <p className="text-xs font-semibold text-[#0E7C66]">{item.optionsString}</p>
                        )}
                        <p className="text-xs" style={{ color: "#3F4B69" }}>x{item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bricolage font-black text-ink text-sm">{formatFcfa(item.product.price * item.quantity)}</p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id, item.optionsString)}
                          aria-label={`Retirer ${item.product.name} du panier`}
                          className="w-9 h-9 rounded-full flex items-center justify-center border border-[#C8265A]/30 text-[#C8265A]"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <DottedDivider />

              {/* Livraison */}
              <div className="flex justify-between py-1 text-sm">
                <span style={{ color: "#3F4B69" }}>Livraison</span>
                <span className="font-semibold" style={{ color: "#3F4B69" }}>À calculer</span>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-bold text-ink">Total</span>
                <span className="font-bricolage font-black text-ink" style={{ fontSize: "1.6rem", letterSpacing: "-0.02em" }}>
                  {formatFcfa(subtotal)}
                </span>
              </div>
            </div>
          </TicketShape>
        </div>

        {/* ─── INFOS LIVRAISON ─── */}
        <div className="px-4 max-w-xl mx-auto mb-4">
          <div className="rounded-2xl border-[2px] border-ink p-5" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
            <h2 className="font-bold text-white text-sm mb-4">Infos de livraison</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#C3CCE6" }}>Téléphone *</label>
                <input
                  required
                  name="phone"
                  type="tel"
                  placeholder="77 123 45 67"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none border-[2.5px] border-ink focus:border-sun"
                  style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#C3CCE6" }}>Nom complet *</label>
                <input
                  required
                  name="name"
                  type="text"
                  placeholder="Prénom Nom"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none border-[2.5px] border-ink focus:border-sun"
                  style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#C3CCE6" }}>Quartier et point de repère *</label>
                <textarea
                  required
                  name="address"
                  rows={2}
                  placeholder="Quartier, rue, près de…"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none border-[2.5px] border-ink focus:border-sun resize-none"
                  style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── MODE DE PAIEMENT ─── */}
        <div className="px-4 max-w-xl mx-auto mb-4">
          <div className="rounded-2xl border-[2px] border-ink p-5" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
            <h2 className="font-bold text-white text-sm mb-3">Paiement</h2>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setPaymentMethod(pm.value)}
                  className="px-4 py-2 rounded-full text-xs font-bold border-[2px] border-ink transition-all"
                  style={{
                    backgroundColor: paymentMethod === pm.value ? "#FFC83D" : "transparent",
                    color: paymentMethod === pm.value ? "#0F1E3D" : "#fff",
                    boxShadow: paymentMethod === pm.value ? "2px 2px 0 #0F1E3D" : "none",
                  }}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Erreur ─── */}
        {error && (
          <div className="px-4 max-w-xl mx-auto mb-4">
            <div className="px-4 py-3 rounded-xl border-[2px] text-sm font-medium" style={{ backgroundColor: "rgba(200,38,90,0.15)", borderColor: "#C8265A", color: "#FFE3EC" }}>
              {error}
            </div>
          </div>
        )}

        {/* ─── CTA ─── */}
        <div className="px-4 max-w-xl mx-auto">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-full font-bold text-base border-[2.5px] border-ink flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "4px 4px 0 #FFC83D" }}
          >
            {isSubmitting ? (
              <>
                <JaaymaLoader variant="mini-ink" size={36} label="Envoi de la commande" />
                <span>Envoi de la commande…</span>
              </>
            ) : (
              "Confirmer la commande"
            )}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showClearCartModal}
        onClose={() => setShowClearCartModal(false)}
        onConfirm={() => {
          clearCart();
          setShowClearCartModal(false);
        }}
        title="Vider votre panier ?"
        description="Tous les articles actuellement sélectionnés seront retirés de votre commande."
        confirmLabel="Oui, vider le panier"
        cancelLabel="Garder mes articles"
        variant="danger"
        icon="trash"
      />
    </div>
  );
}
