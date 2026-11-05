"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setShopPlan, setShopSuspension } from "@/app/actions/admin";
import { ExternalLink, Package, ShoppingBag, Ban, CheckCircle2, FileText, Sparkles, Zap } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import ConfirmModal from "@/components/ConfirmModal";

interface ShopRowProps {
  shop: {
    id: string;
    name: string;
    slug: string;
    plan: "free" | "pro" | "pro_plus";
    planExpiresAt: number | null;
    isPublished: boolean;
    isSuspended: boolean;
    isDraft: boolean;
    isExpiredPlan: boolean;
    createdAt: number;
    sellerName: string;
    sellerPhone: string;
    productCount: number;
    orderCount: number;
  };
}

export default function AdminShopRow({ shop }: ShopRowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPlan, setCurrentPlan] = useState<"free" | "pro" | "pro_plus">(shop.plan);
  const [isSuspended, setIsSuspended] = useState(shop.isSuspended);
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  const selectedPlanDuration = 30;
  const selectedPlanLabel = currentPlan === "pro_plus" ? "Pro+" : "Pro";

  let expiryFormatted = "";
  if (shop.planExpiresAt) {
    expiryFormatted = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(shop.planExpiresAt * 1000));
  }

  async function handleSavePlan() {
    const nextPlan = currentPlan;
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await setShopPlan(shop.id, nextPlan);
    if (!res.error) {
      setSuccess(nextPlan === "free" ? "Plan Gratuit activé." : `Plan ${selectedPlanLabel} actif pour ${selectedPlanDuration} jours.`);
      router.refresh();
    } else {
      setError(res.error);
    }
    setLoading(false);
  }

  async function handleConfirmSuspension() {
    setShowSuspendModal(false);
    const nextSuspended = !isSuspended;
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await setShopSuspension(shop.id, nextSuspended);
    if (!res.error) {
      setIsSuspended(nextSuspended);
      setSuccess(nextSuspended ? "Boutique suspendue." : "Boutique rétablie.");
      router.refresh();
    } else {
      setError(res.error);
    }
    setLoading(false);
  }

  return (
    <tr className={`border-t border-ink/10 text-sm transition-colors hover:bg-ink/[0.03] md:grid md:grid-cols-2 md:rounded-[20px] md:border md:border-ink/10 md:bg-white md:p-2 md:shadow-[2px_2px_0_#0F1E3D] 2xl:table-row 2xl:rounded-none 2xl:border-0 2xl:border-t 2xl:bg-transparent 2xl:p-0 2xl:shadow-none ${isSuspended ? "bg-hibiscus/[0.06]" : ""}`}>
      {/* Shop Info */}
      <td className="py-4 px-4 md:block md:min-w-0 md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink">{shop.name}</span>
            <a
              href={`/${shop.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-muted/70 transition-colors hover:text-[#9A6500]"
              title="Visiter la boutique"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted/70">/{shop.slug}</p>
        </div>
      </td>

      {/* Seller */}
      <td className="py-4 px-4 text-xs md:block md:min-w-0 md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4">
        <span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Vendeur</span>
        <span className="block font-semibold text-ink">{shop.sellerName}</span>
        <span className="mt-0.5 block font-mono text-muted">{shop.sellerPhone}</span>
        <span className="mt-1 block text-muted/65">
          Créée le {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(shop.createdAt * 1000))}
        </span>
      </td>

      {/* Products & Orders */}
      <td className="py-4 px-4 text-xs font-medium text-muted md:block md:min-w-0 md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4">
        <span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Activité</span>
        <div className="flex items-center gap-1.5">
          <Package size={13} className="shrink-0 text-muted/70" />
          <span>{shop.productCount} {shop.productCount === 1 ? "produit" : "produits"}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <ShoppingBag size={13} className="shrink-0 text-muted/70" />
          <span>{shop.orderCount} {shop.orderCount === 1 ? "commande" : "commandes"}</span>
        </div>
      </td>

      {/* Status */}
      <td className="py-4 px-4 md:block md:min-w-0 md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4">
        <span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Statut & plan</span>
        <div className="flex flex-col gap-1 items-start">
          {isSuspended ? (
            <span className="inline-flex -rotate-2 items-center gap-1 rounded border-2 border-hibiscus px-2.5 py-1 text-[11px] font-black text-[#A51F49]">
              <span>Suspendue</span>
              <Ban size={12} className="shrink-0" />
            </span>
          ) : shop.isDraft ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-ink/5 px-2.5 py-1 text-[10px] font-black text-muted">
              <FileText size={12} /> Brouillon
            </span>
          ) : shop.isPublished ? (
            <span className="inline-flex -rotate-2 items-center gap-1 rounded border-2 border-baobab px-2.5 py-1 text-[11px] font-black text-baobab">
              <span>En ligne</span>
              <CheckCircle2 size={12} className="shrink-0" />
            </span>
          ) : (
            <span className="inline-flex -rotate-2 items-center gap-1 rounded border-2 border-ink/15 px-2.5 py-1 text-[11px] font-black text-muted">
              <span>Brouillon</span>
              <FileText size={12} className="shrink-0" />
            </span>
          )}

          {shop.isExpiredPlan ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#F3C65E]/40 bg-[#F3C65E]/10 px-2.5 py-1 text-[10px] font-black text-[#8A5A00]">{shop.plan === "pro_plus" ? "Pro+ expiré" : "Pro expiré"}</span>
          ) : shop.plan === "pro_plus" ? (
            <span className="inline-flex items-center gap-1 rounded border-2 border-ink bg-sun px-2.5 py-1 text-[11px] font-black text-ink shadow-[2px_2px_0_#0F1E3D]">
              <span>Pro+</span><Sparkles size={11} className="shrink-0" />{expiryFormatted ? `(${expiryFormatted})` : ""}
            </span>
          ) : shop.plan === "pro" ? (
            <span className="inline-flex items-center gap-1 rounded border-2 border-sun px-2.5 py-1 text-[11px] font-black text-[#9A6500]">
              <span>Pro</span>
              <Zap size={11} className="shrink-0 fill-sun text-[#9A6500]" />
              {expiryFormatted ? `(${expiryFormatted})` : ""}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-ink/15 px-2.5 py-1 text-[10px] font-semibold text-muted">
              Gratuit
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="py-4 px-4 text-right md:col-span-2 md:block md:min-w-0 md:px-2 md:py-2 md:text-left 2xl:table-cell 2xl:px-4 2xl:py-4 2xl:text-right">
        <span className="mb-2 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Gestion</span>
        <div className="flex flex-col items-end gap-2 md:items-stretch 2xl:items-end">
          <div className="flex items-center justify-end gap-2 md:flex-wrap md:justify-start 2xl:justify-end">
            {/* Plan selector */}
            <select
              aria-label={`Formule de ${shop.name}`}
              value={currentPlan}
              onChange={(event) => setCurrentPlan(event.target.value as "free" | "pro" | "pro_plus")}
              disabled={loading}
              className="min-h-9 rounded-full border-2 border-ink bg-papier px-3 text-xs font-bold text-ink outline-none focus:ring-2 focus:ring-sun disabled:opacity-60"
            >
              <option value="free">Gratuit</option>
              <option value="pro">Pro · 30 jours</option>
              <option value="pro_plus">Pro+ · 30 jours</option>
            </select>
            <button
              type="button"
              onClick={handleSavePlan}
              disabled={loading || (currentPlan === "free" && shop.plan === "free")}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-sun px-3 text-xs font-black text-ink shadow-[2px_2px_0_#0F1E3D] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <JaaymaLoader variant="mini-ink" size={28} />
              ) : currentPlan === "free" ? (
                shop.plan === "free" ? "Plan actuel" : "Passer en Gratuit"
              ) : currentPlan === shop.plan ? (
                `Renouveler ${selectedPlanLabel}`
              ) : (
                `Activer ${selectedPlanLabel}`
              )}
            </button>
          </div>
          {/* Suspend Button */}
          <button
            type="button"
            onClick={() => setShowSuspendModal(true)}
            disabled={loading}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border-[2px] border-ink transition-all ${
              isSuspended
                ? "bg-baobab text-white hover:-translate-y-0.5"
                : "bg-papier text-hibiscus hover:bg-hibiscus/10"
            }`}
          >
            {isSuspended ? "Rétablir" : "Suspendre"}
          </button>
        </div>

        <ConfirmModal
          isOpen={showSuspendModal}
          onClose={() => setShowSuspendModal(false)}
          onConfirm={handleConfirmSuspension}
          title={isSuspended ? `Rétablir la boutique ?` : `Suspendre la boutique ?`}
          description={
            isSuspended
              ? `Voulez-vous rétablir la boutique "${shop.name}" ? Elle sera de nouveau accessible aux clients.`
              : `Êtes-vous sûr de vouloir suspendre la boutique "${shop.name}" ? Elle ne sera plus accessible aux clients.`
          }
          confirmLabel={isSuspended ? "Oui, rétablir" : "Oui, suspendre"}
          cancelLabel="Annuler"
          variant={isSuspended ? "primary" : "danger"}
          icon="warning"
          isLoading={loading}
        />
        {(error || success) && (
          <p role={error ? "alert" : "status"} className={`mt-2 text-right text-[10px] font-bold ${error ? "text-[#A51F49]" : "text-baobab"}`}>
            {error || success}
          </p>
        )}
      </td>
    </tr>
  );
}
