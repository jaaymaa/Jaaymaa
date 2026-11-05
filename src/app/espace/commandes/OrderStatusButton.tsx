"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { updateOrderStatus, updatePaymentStatus } from "../../actions/order";
import type { OrderStatus, PaymentStatus } from "@/lib/orders";
import ConfirmModal from "@/components/ConfirmModal";

const NEXT_LABEL: Record<string, string> = {
  preparing:        "Passer en préparation",
  out_for_delivery: "Expédier / En cours",
  delivered:        "Marquer comme livrée",
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  new:              "preparing",
  preparing:        "out_for_delivery",
  out_for_delivery: "delivered",
  delivered:        null,
  cancelled:        null,
};

export default function OrderStatusButton({
  orderId,
  currentStatus,
  currentPaymentStatus,
  onStatusChange,
  onPaymentChange,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  currentPaymentStatus?: PaymentStatus;
  onStatusChange?: (status: OrderStatus) => void;
  onPaymentChange?: (payment: PaymentStatus) => void;
}) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    currentPaymentStatus || "pending"
  );
  const [, startTransition] = useTransition();
  const [isPaymentSyncing, setIsPaymentSyncing] = useState(false);
  const [isStatusSyncing, setIsStatusSyncing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const nextStatus = NEXT_STATUS[status];

  // ─── 0ms OPTIMISTIC STATUS ADVANCE ───
  function handleAdvance() {
    if (!nextStatus || isStatusSyncing) return;
    const previous = status;
    const target = nextStatus;

    // 1. Mise à jour instantanée (0 milliseconde)
    setStatus(target);
    onStatusChange?.(target);
    setIsStatusSyncing(true);
    setErrorMsg(null);

    // 2. Synchronisation en arrière-plan sans bloquer l'UI
    startTransition(async () => {
      try {
        const res = await updateOrderStatus(orderId, target);
        if (res?.error) {
          // Rollback en cas d'erreur
          setStatus(previous);
          onStatusChange?.(previous);
          setErrorMsg(res.error);
        }
      } catch {
        setStatus(previous);
        onStatusChange?.(previous);
        setErrorMsg("Impossible de mettre à jour le statut.");
      } finally {
        setIsStatusSyncing(false);
      }
    });
  }

  // ─── 0ms OPTIMISTIC PAYMENT TOGGLE ───
  function handleTogglePayment() {
    if (isPaymentSyncing) return;
    const previous = paymentStatus;
    const nextPayment: PaymentStatus = paymentStatus === "paid" ? "pending" : "paid";

    // 1. Mise à jour instantanée (0 milliseconde)
    setPaymentStatus(nextPayment);
    onPaymentChange?.(nextPayment);
    setIsPaymentSyncing(true);
    setErrorMsg(null);

    // 2. Synchronisation en arrière-plan
    startTransition(async () => {
      try {
        const res = await updatePaymentStatus(orderId, nextPayment);
        if (res?.error) {
          // Rollback en cas d'erreur
          setPaymentStatus(previous);
          onPaymentChange?.(previous);
          setErrorMsg(res.error);
        }
      } catch {
        setPaymentStatus(previous);
        onPaymentChange?.(previous);
        setErrorMsg("Impossible de modifier le paiement.");
      } finally {
        setIsPaymentSyncing(false);
      }
    });
  }

  // ─── OPTIMISTIC CANCEL ───
  function handleConfirmCancel() {
    setShowCancelModal(false);
    if (isStatusSyncing) return;
    const previous = status;

    setStatus("cancelled");
    onStatusChange?.("cancelled");
    setIsStatusSyncing(true);

    startTransition(async () => {
      try {
        const res = await updateOrderStatus(orderId, "cancelled");
        if (res?.error) {
          setStatus(previous);
          onStatusChange?.(previous);
          setErrorMsg(res.error);
        }
      } catch {
        setStatus(previous);
        onStatusChange?.(previous);
        setErrorMsg("Erreur lors de l'annulation.");
      } finally {
        setIsStatusSyncing(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {errorMsg && (
        <div className="p-3 rounded-xl border-[2px] border-hibiscus bg-hibiscus/10 text-hibiscus text-xs font-bold text-center">
          {errorMsg}
        </div>
      )}

      {/* Bouton Paiement */}
      {paymentStatus !== "paid" ? (
        <button
          type="button"
          onClick={handleTogglePayment}
          disabled={isPaymentSyncing}
          className="w-full py-4 rounded-full font-bold text-[15px] border-[2.5px] border-ink flex items-center justify-center gap-2 active:scale-95 transition-transform bg-sun text-ink disabled:opacity-80"
          style={{ boxShadow: "4px 4px 0 #0F1E3D" }}
        >
          {isPaymentSyncing ? (
            <>
              <JaaymaLoader variant="mini-ink" size={32} />
              <span>Validation en cours...</span>
            </>
          ) : (
            <span>Confirmer le paiement</span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleTogglePayment}
          disabled={isPaymentSyncing}
          className="w-full py-4 rounded-full font-bold text-[15px] border-[2.5px] flex items-center justify-center gap-2 active:scale-95 transition-transform bg-baobab border-baobab text-white disabled:opacity-80"
        >
          {isPaymentSyncing ? (
            <JaaymaLoader size={32} />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-white" />
          )}
          <span>Paiement validé (Annuler)</span>
        </button>
      )}

      {/* Bouton Statut Suivant */}
      {nextStatus && (
        <button
          type="button"
          onClick={handleAdvance}
          disabled={isStatusSyncing}
          className="w-full py-4 rounded-full font-bold text-[15px] border-[2px] flex items-center justify-center gap-2 active:scale-95 transition-transform bg-white/5 hover:bg-white/10 border-white/20 text-white disabled:opacity-80"
        >
          {isStatusSyncing ? (
            <JaaymaLoader size={32} />
          ) : null}
          <span>{NEXT_LABEL[nextStatus]}</span>
        </button>
      )}

      {/* Option Annuler */}
      {status !== "delivered" && status !== "cancelled" && (
        <button
          type="button"
          onClick={() => setShowCancelModal(true)}
          disabled={isStatusSyncing}
          className="w-full py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform mt-2 text-hibiscus hover:bg-hibiscus/15 disabled:opacity-60"
          style={{ backgroundColor: "rgba(200,38,90,0.08)" }}
        >
          Annuler la commande
        </button>
      )}

      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        title="Annuler cette commande ?"
        description="Cette action marquera la commande comme annulée. Le client en sera informé."
        confirmLabel="Oui, annuler la commande"
        cancelLabel="Ne pas annuler"
        variant="danger"
        icon="warning"
        isLoading={isStatusSyncing}
      />
    </div>
  );
}
