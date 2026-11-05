"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readProSubscriptionPayment } from "@/app/actions/subscription";

type PaymentStatus = "pending" | "paid" | "failed" | "expired";

export function SubscriptionPaymentNotice({
  paymentId,
  initialStatus,
  initialPlan,
  returnedCancelled,
}: {
  paymentId: string;
  initialStatus: PaymentStatus | null;
  initialPlan: "pro" | "pro_plus";
  returnedCancelled: boolean;
}) {
  const [status, setStatus] = useState<PaymentStatus | null>(initialStatus);
  const [plan, setPlan] = useState(initialPlan);
  const [timedOut, setTimedOut] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pollGeneration, setPollGeneration] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (status !== "pending") return;
    let stopped = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const refresh = async () => {
      const payment = await readProSubscriptionPayment(paymentId);
      if (stopped) return;
      if (payment) {
        setStatus(payment.status);
        setPlan(payment.plan);
        if (payment.status === "paid") {
          router.refresh();
          return;
        }
        if (payment.status !== "pending") return;
      }
      attempts += 1;
      if (attempts < 45) timer = setTimeout(refresh, 4000);
      else {
        setTimedOut(true);
        timer = setTimeout(refresh, 30_000);
      }
    };

    timer = setTimeout(refresh, 2500);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [paymentId, pollGeneration, router, status]);

  async function checkStatusNow() {
    setChecking(true);
    try {
      const payment = await readProSubscriptionPayment(paymentId);
      if (!payment) {
        router.refresh();
        return;
      }
      setStatus(payment.status);
      setPlan(payment.plan);
      setTimedOut(false);
      if (payment.status === "pending") setPollGeneration((generation) => generation + 1);
      if (payment.status === "paid") router.refresh();
    } finally {
      setChecking(false);
    }
  }

  const planLabel = plan === "pro_plus" ? "Pro+" : "Pro";
  const copy = status === "paid"
    ? { title: "Paiement confirmé", body: `Votre boutique vient de passer au plan ${planLabel}. Actualisation de votre espace…`, color: "#0E7C66" }
    : status === "failed"
      ? { title: "Paiement non abouti", body: "Wave ou Orange Money n’a pas confirmé le paiement. Vérifiez votre solde avant de réessayer.", color: "#C8265A" }
      : status === "expired"
        ? { title: "Session de paiement expirée", body: `Cette session a expiré. Relancez un paiement pour activer Pro${plan === "pro_plus" ? "+" : ""}.`, color: "#8A5A00" }
        : returnedCancelled
          ? { title: "Paiement annulé ou refusé", body: "Aucun paiement n’a été confirmé. Si Wave indique « solde insuffisant », approvisionnez votre portefeuille avant de réessayer.", color: "#C8265A" }
          : timedOut
            ? { title: "Aucun paiement confirmé", body: "Nous n’avons toujours pas reçu de confirmation. Si aucun débit n’apparaît dans Wave ou Orange Money, vous pouvez réessayer. Si un débit apparaît, vérifiez le statut avant de repayer.", color: "#8A5A00" }
            : { title: "Paiement non confirmé", body: `Nous n’avons pas encore reçu de confirmation et votre plan ${planLabel} n’est pas activé. Si Wave indique « solde insuffisant », approvisionnez le portefeuille avant de réessayer.`, color: "#8A5A00" };

  return (
    <div className="mb-5 rounded-2xl border-2 border-ink p-4" style={{ backgroundColor: "#FFFBF2" }} role="status" aria-live="polite">
      <p className="font-bricolage font-black text-ink" style={{ color: copy.color }}>{copy.title}</p>
      <p className="mt-1 text-sm font-medium text-ink/75">{copy.body}</p>
      {status === "pending" && (
        <button
          type="button"
          onClick={checkStatusNow}
          disabled={checking}
          className="mt-3 text-sm font-black text-ink underline underline-offset-4"
        >
          {checking ? "Vérification…" : "Vérifier le statut maintenant"}
        </button>
      )}
    </div>
  );
}
