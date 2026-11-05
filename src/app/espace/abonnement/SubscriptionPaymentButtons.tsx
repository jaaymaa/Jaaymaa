"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { startProSubscriptionPayment } from "@/app/actions/subscription";

export function SubscriptionPaymentButtons({
  price,
  isRenewal = false,
  plan = "pro",
}: {
  price: string | null;
  isRenewal?: boolean;
  plan?: "pro" | "pro_plus";
}) {
  const [pendingMethod, setPendingMethod] = useState<"wave" | "orange_money" | null>(null);
  const submissionStarted = useRef(false);
  const isPending = pendingMethod !== null;

  function markPending(event: FormEvent<HTMLFormElement>, method: "wave" | "orange_money") {
    if (submissionStarted.current) {
      event.preventDefault();
      return;
    }
    submissionStarted.current = true;
    setPendingMethod(method);
  }

  const actionLabel = isRenewal
    ? "Prolonger avec"
    : plan === "pro_plus" ? "Passer à Pro+ avec" : "Payer avec";
  const paymentMethods = [
    { method: "wave", label: "Wave", logo: "/payments/wave.png" },
    { method: "orange_money", label: "Orange Money", logo: "/payments/orange-money.svg" },
  ] as const;

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        {paymentMethods.map(({ method, label, logo }) => (
          <form
            key={method}
            action={startProSubscriptionPayment}
            onSubmit={(event) => markPending(event, method)}
          >
            <input type="hidden" name="method" value={method} />
            <input type="hidden" name="plan" value={plan} />
            <button
              type="submit"
              disabled={isPending || !price}
              className="flex min-h-[68px] w-full items-center justify-center gap-1.5 rounded-full border-[2.5px] border-ink bg-[#FDF9F2] px-2 py-1.5 text-left text-ink shadow-[3px_4px_0_#151D3B] transition-transform active:translate-y-0.5 active:shadow-[2px_3px_0_#151D3B] disabled:cursor-wait disabled:opacity-80 sm:min-h-[84px] sm:gap-2.5 sm:px-3 sm:py-2 sm:shadow-[4px_5px_0_#151D3B]"
            >
              {pendingMethod === method ? (
                <JaaymaLoader size={32} />
              ) : price ? (
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                    method === "orange_money" ? "border border-[#E6DDC8] bg-white" : ""
                  }`}
                  aria-hidden="true"
                >
                  <Image
                    src={logo}
                    alt=""
                    width={44}
                    height={44}
                    className="h-full w-full rounded-full object-contain"
                  />
                </span>
              ) : null}
              <span className="flex min-w-0 flex-col leading-tight">
                {pendingMethod === method
                  ? "Création du paiement…"
                  : isPending
                  ? "Patientez…"
                  : price
                  ? <>
                      <span className="text-[8px] font-semibold text-[#5B5640] sm:text-[10px]">{actionLabel}</span>
                      <span className="text-xs font-black sm:text-sm">{label}</span>
                      <span className="text-[10px] font-bold sm:text-xs">{price} F</span>
                    </>
                  : "Prix indisponible"}
              </span>
            </button>
          </form>
        ))}
      </div>
      {(isPending || !price) && (
        <p className="text-center text-xs font-medium text-[#5B5640]" role="status" aria-live="polite">
          {isPending
            ? "Préparation sécurisée du paiement, cela peut prendre quelques secondes. Ne fermez pas cette page."
            : "Le tarif ne peut pas être chargé. Actualisez la page pour réessayer."}
        </p>
      )}
    </>
  );
}
