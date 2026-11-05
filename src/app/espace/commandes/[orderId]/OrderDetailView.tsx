"use client";

import { useState } from "react";
import Link from "next/link";
import { formatFcfa } from "@/lib/money";
import { normalizePhone } from "@/lib/phone";
import { waLink } from "@/lib/whatsapp";
import OrderStatusButton from "../OrderStatusButton";
import type { Order } from "@/types/schema";
import type { OrderStatus, PaymentStatus } from "@/lib/orders";

export default function OrderDetailView({ order }: { order: Order }) {
  const [status, setStatus] = useState<OrderStatus>(
    (order.status?.toLowerCase() as OrderStatus) || "new"
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    (order.paymentStatus?.toLowerCase() as PaymentStatus) || "pending"
  );

  const items = order.items ?? [];
  const isPaid = paymentStatus === "paid";
  const initials = order.customerName ? order.customerName.substring(0, 2).toUpperCase() : "CL";
  const normalizedCustomerPhone = normalizePhone(order.customerPhone);
  const customerPhoneDigits = order.customerPhone.replace(/\D/g, "");
  const customerWhatsAppHref = normalizedCustomerPhone
    ? waLink(normalizedCustomerPhone)
    : `https://wa.me/${customerPhoneDigits.startsWith("221") ? customerPhoneDigits : `221${customerPhoneDigits}`}`;

  // Date relative : garder les heures pour les commandes récentes, puis afficher
  // les jours et les heures restantes pour éviter des durées comme « 33 heures ».
  const createdTime = new Date(order.createdAt).getTime();
  const diffMs = Date.now() - createdTime;
  const diffMins = Number.isFinite(createdTime) ? Math.max(0, Math.floor(diffMs / 60000)) : null;
  let timeStr = "Date indisponible";
  if (diffMins !== null) {
    if (diffMins < 60) {
      timeStr = `Il y a ${diffMins} minute${diffMins === 1 ? "" : "s"}`;
    } else {
      const elapsedHours = Math.floor(diffMins / 60);
      if (elapsedHours < 24) {
        timeStr = `Il y a ${elapsedHours} heure${elapsedHours === 1 ? "" : "s"}`;
      } else {
        const elapsedDays = Math.floor(elapsedHours / 24);
        const remainingHours = elapsedHours % 24;
        const dayLabel = `${elapsedDays} jour${elapsedDays === 1 ? "" : "s"}`;
        timeStr = remainingHours > 0
          ? `Il y a ${dayLabel} et ${remainingHours} heure${remainingHours === 1 ? "" : "s"}`
          : `Il y a ${dayLabel}`;
      }
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl p-5 md:max-w-3xl md:px-8 xl:max-w-4xl" style={{ backgroundColor: "#0F1E3D" }}>
      {/* ─── HEADER ─── */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/espace/commandes"
          prefetch={true}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border-[2px] border-ink active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F1E3D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h1 className="font-bricolage font-black text-white text-lg sm:text-2xl leading-tight break-all select-all">{order.reference}</h1>
          {status === "new" && (
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded border-[2px] border-[#C8265A] text-[#C8265A] bg-[#C8265A]/10 shrink-0">
              NOUVELLE
            </span>
          )}
          {status === "preparing" && (
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded border-[2px] border-[#0E7C66] text-[#0E7C66] bg-[#0E7C66]/10">
              EN PRÉP.
            </span>
          )}
          {status === "out_for_delivery" && (
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded border-[2px] border-[#FFC83D] text-[#FFC83D] bg-[#FFC83D]/10">
              EXPÉDIÉE
            </span>
          )}
          {status === "delivered" && (
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded border-[2px] border-[#3F4B69] text-[#FFFBF2] bg-[#3F4B69]">
              LIVRÉE
            </span>
          )}
          {status === "cancelled" && (
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded border-[2px] border-hibiscus text-hibiscus bg-hibiscus/10">
              ANNULÉE
            </span>
          )}
        </div>
      </div>

      {/* ─── TICKET COMMANDE ─── */}
      <div className="relative">
        {/* Dents haut */}
        <svg viewBox="0 0 344 18" preserveAspectRatio="none" style={{ width: "100%", height: 18, display: "block" }}>
          <path d="M0 18H344V0L334.6 9L325.1 0L315.7 9L306.3 0L296.9 9L287.4 0L278.0 9L268.6 0L259.1 9L249.7 0L240.3 9L230.9 0L221.4 9L212.0 0L202.6 9L193.1 0L183.7 9L174.3 0L164.9 9L155.4 0L146.0 9L136.6 0L127.1 9L117.7 0L108.3 9L98.9 0L89.4 9L80.0 0L70.6 9L61.0 0L51.8 9L42.5 0L33.2 9L23.4 0L14.0 9L4.6 0L0 9Z" fill="#FFFBF2" stroke="#0F1E3D" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* Corps du ticket */}
        <div className="px-5 py-2" style={{ backgroundColor: "#FFFBF2" }}>
          {/* Client */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-[2px] border-ink shadow-sm"
              style={{
                backgroundColor:
                  ["#FFC83D", "#F6C3D2", "#CFEFE6", "#DCE5FF"][
                    Math.abs((order.customerName || "CL").charCodeAt(0)) % 4
                  ],
              }}
            >
              <span className="font-bricolage font-black text-ink text-xl">{initials}</span>
            </div>
            <div className="flex-1">
              <p className="font-bricolage font-black text-ink text-lg leading-tight">{order.customerName}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "#3F4B69" }}>{timeStr}</p>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${order.customerPhone}`} className="w-11 h-11 rounded-full flex items-center justify-center border-[2px] border-ink bg-sun shadow-[2px_2px_0_#0F1E3D] active:scale-95 transition-transform" aria-label="Appeler le client">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F1E3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </a>
              <a href={customerWhatsAppHref} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-full flex items-center justify-center border-[2px] border-ink bg-[#0E7C66] shadow-[2px_2px_0_#0F1E3D] active:scale-95 transition-transform" aria-label="Contacter sur WhatsApp">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="h-px border-b-[1.5px] border-dashed border-ink/20 w-full mb-4" />

          {/* Adresse */}
          <div className="mb-4">
            <p className="text-xs font-bold mb-1" style={{ color: "#3F4B69" }}>Livraison</p>
            <p className="text-[15px] font-bold text-ink">{order.customerAddress || "Adresse non spécifiée"}</p>
          </div>

          <div className="h-px border-b-[1.5px] border-dashed border-ink/20 w-full mb-4" />

          {/* Articles */}
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-start text-[15px] font-bold">
                <div className="pr-4">
                  <p className="text-ink">{item.name} {item.quantity > 1 && `(x${item.quantity})`}</p>
                  {item.options && (
                    <p className="text-xs text-[#0E7C66] font-bold">{item.options}</p>
                  )}
                </div>
                <p className="text-ink shrink-0">{formatFcfa(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
            <div className="flex justify-between items-center text-[15px] font-bold">
              <p className="text-ink">Livraison</p>
              <p className="text-ink">{order.deliveryFee === 0 ? "Gratuit" : formatFcfa(order.deliveryFee)}</p>
            </div>
          </div>

          <div className="h-px border-b-[1.5px] border-dashed border-ink/20 w-full mb-4" />

          {/* Total */}
          <div className="flex justify-between items-end mb-4">
            <p className="font-bold text-ink text-base mb-1">Total</p>
            <p className="font-bricolage font-black text-ink leading-none" style={{ fontSize: "1.75rem", letterSpacing: "-0.02em" }}>
              {formatFcfa(order.total)}
            </p>
          </div>

          <div className="h-px border-b-[1.5px] border-dashed border-ink/20 w-full mb-4" />

          {/* Paiement avec bascule optimiste 0ms */}
          <div className="relative mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: "#3F4B69" }}>Paiement</p>
              <p className="text-[15px] font-bold text-ink mb-1">
                {order.paymentMethod === "wave" ? "Wave" : order.paymentMethod === "orange_money" ? "Orange Money" : "Espèces"}, {isPaid ? "payé" : "en attente"}
              </p>
            </div>
            {!isPaid ? (
              <div>
                <span className="text-[11px] font-black px-2.5 py-1 rounded border-[2px] transition-all" style={{ borderColor: "#C8265A", color: "#C8265A", transform: "rotate(-3deg)", display: "inline-block" }}>
                  NON PAYÉE
                </span>
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-black px-2.5 py-1 rounded border-[2px] transition-all animate-bounce-subtle" style={{ borderColor: "#0E7C66", color: "#0E7C66", transform: "rotate(-3deg)", display: "inline-block" }}>
                  PAYÉE
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dents bas */}
        <svg viewBox="0 0 344 18" preserveAspectRatio="none" style={{ width: "100%", height: 18, display: "block" }}>
          <path d="M0 0H344V18L334.6 9L325.1 18L315.7 9L306.3 18L296.9 9L287.4 18L278.0 9L268.6 18L259.1 9L249.7 18L240.3 9L230.9 18L221.4 9L212.0 18L202.6 9L193.1 18L183.7 9L174.3 18L164.9 9L155.4 18L146.0 9L136.6 18L127.1 9L117.7 18L108.3 9L98.9 18L89.4 9L80.0 18L70.6 9L61.1 18L51.7 9L42.3 18L32.9 9L23.4 18L14.0 9L4.6 18L0 9Z" fill="#FFFBF2" stroke="#0F1E3D" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      {/* ─── BOUTONS D'ACTION SYNCHRONISÉS À 0ms ─── */}
      <div className="mt-6 flex flex-col gap-3">
        <OrderStatusButton
          orderId={order.id}
          currentStatus={status}
          currentPaymentStatus={paymentStatus}
          onStatusChange={setStatus}
          onPaymentChange={setPaymentStatus}
        />
      </div>
    </div>
  );
}
