"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { setProSubscriptionPrice, setProPlusSubscriptionPrice } from "@/app/actions/admin";
import { adminPanelClass } from "../AdminUI";

export default function ProPriceControl({
  initialPrice,
  initialProPlusPrice = 10000,
}: {
  initialPrice: number;
  initialProPlusPrice?: number;
}) {
  const [proPrice, setProPrice] = useState(String(initialPrice));
  const [isProPending, setIsProPending] = useState(false);
  const [proMessage, setProMessage] = useState<string | null>(null);
  const [proError, setProError] = useState<string | null>(null);

  const [proPlusPrice, setProPlusPrice] = useState(String(initialProPlusPrice));
  const [isProPlusPending, setIsProPlusPending] = useState(false);
  const [proPlusMessage, setProPlusMessage] = useState<string | null>(null);
  const [proPlusError, setProPlusError] = useState<string | null>(null);

  async function saveProPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isProPending) return;

    const amount = Number(proPrice);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100_000_000) {
      setProError("Saisissez un montant entier entre 1 et 100 000 000 F.");
      setProMessage(null);
      return;
    }

    setIsProPending(true);
    setProError(null);
    setProMessage(null);
    try {
      const result = await setProSubscriptionPrice(amount);
      if ("error" in result) {
        setProError(result.error ?? "Impossible de modifier le prix Pro.");
      } else {
        setProPrice(String(result.amount));
        setProMessage("Le prix Pro a été mis à jour.");
      }
    } catch {
      setProError("Impossible de modifier le prix Pro. Réessayez.");
    } finally {
      setIsProPending(false);
    }
  }

  async function saveProPlusPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isProPlusPending) return;

    const amount = Number(proPlusPrice);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100_000_000) {
      setProPlusError("Saisissez un montant entier entre 1 et 100 000 000 F.");
      setProPlusMessage(null);
      return;
    }

    setIsProPlusPending(true);
    setProPlusError(null);
    setProPlusMessage(null);
    try {
      const result = await setProPlusSubscriptionPrice(amount);
      if ("error" in result) {
        setProPlusError(result.error ?? "Impossible de modifier le prix Pro+.");
      } else {
        setProPlusPrice(String(result.amount));
        setProPlusMessage("Le prix mensuel Pro+ a été mis à jour.");
      }
    } catch {
      setProPlusError("Impossible de modifier le prix Pro+. Réessayez.");
    } finally {
      setIsProPlusPending(false);
    }
  }

  return (
    <div className="space-y-4 mb-5">
      {/* FORMULE PRO (MENSUELLE) */}
      <section className={`${adminPanelClass()} p-5 sm:p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-ink/20 bg-sun/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-ink">
                Formule Mensuelle
              </span>
            </div>
            <h2 className="mt-1 font-bricolage text-lg font-black">Prix de la formule Pro</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-muted">
              Appliqué aux prochains paiements vendeurs pour 30 jours (100 produits, 3 photos/produit).
            </p>
          </div>
          <form onSubmit={saveProPrice} className="flex flex-col gap-2 sm:min-w-[310px]">
            <label htmlFor="pro-price" className="text-xs font-black text-ink">Montant mensuel (FCFA)</label>
            <div className="flex gap-2">
              <input
                id="pro-price"
                name="amount"
                type="number"
                inputMode="numeric"
                min={1}
                max={100_000_000}
                step={1}
                required
                value={proPrice}
                onChange={(event) => setProPrice(event.target.value)}
                disabled={isProPending}
                className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-white px-3 py-2.5 text-sm font-black text-ink outline-none focus:ring-2 focus:ring-sun disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={isProPending}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-ink bg-sun px-4 text-xs font-black text-ink shadow-[2px_2px_0_#0F1E3D] transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-70"
              >
                {isProPending ? <JaaymaLoader variant="mini-ink" size={28} /> : <Save size={15} />}
                {isProPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
        {proError && <p role="alert" className="mt-3 text-xs font-bold text-hibiscus">{proError}</p>}
        {proMessage && <p role="status" className="mt-3 text-xs font-bold text-baobab">{proMessage}</p>}
      </section>

      {/* FORMULE PRO+ (MENSUELLE) */}
      <section className={`${adminPanelClass()} p-5 sm:p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-ink/20 bg-sun/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-ink">
                Formule Mensuelle
              </span>
            </div>
            <h2 className="mt-1 font-bricolage text-lg font-black">Prix de la formule Pro+</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-muted">
              Paiement mensuel pour 30 jours (200 produits, 4 photos/produit, badge certifié & outils marketing).
            </p>
          </div>
          <form onSubmit={saveProPlusPrice} className="flex flex-col gap-2 sm:min-w-[310px]">
            <label htmlFor="pro-plus-price" className="text-xs font-black text-ink">Montant mensuel (FCFA)</label>
            <div className="flex gap-2">
              <input
                id="pro-plus-price"
                name="amount"
                type="number"
                inputMode="numeric"
                min={1}
                max={100_000_000}
                step={1}
                required
                value={proPlusPrice}
                onChange={(event) => setProPlusPrice(event.target.value)}
                disabled={isProPlusPending}
                className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-white px-3 py-2.5 text-sm font-black text-ink outline-none focus:ring-2 focus:ring-sun disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={isProPlusPending}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-ink bg-sun px-4 text-xs font-black text-ink shadow-[2px_2px_0_#0F1E3D] transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-70"
              >
                {isProPlusPending ? <JaaymaLoader variant="mini-ink" size={28} /> : <Save size={15} />}
                {isProPlusPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
        {proPlusError && <p role="alert" className="mt-3 text-xs font-bold text-hibiscus">{proPlusError}</p>}
        {proPlusMessage && <p role="status" className="mt-3 text-xs font-bold text-baobab">{proPlusMessage}</p>}
      </section>
    </div>
  );
}
