import { getCurrentSellerContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEffectivePlan, getProDaysRemaining, getProUrgency } from "@/lib/plans";
import { getSubscriptionPrices, getSubscriptionPayment } from "@/services/subscription.service";
import { SubscriptionPaymentNotice } from "./SubscriptionPaymentNotice";
import { SubscriptionPaymentButtons } from "./SubscriptionPaymentButtons";

export const metadata = {
  title: "Mon Abonnement - Espace Vendeur",
};

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ paiement?: string; erreur?: string; retour?: string }>;
}) {
  const sellerContext = await getCurrentSellerContext();
  if (!sellerContext) redirect("/connexion");
  const { shop } = sellerContext;
  if (!shop) redirect("/espace/boutique");

  const params = await searchParams;
  const paymentId = params.paiement?.trim() || "";
  const payment = paymentId
    ? await getSubscriptionPayment(paymentId, sellerContext.sellerId).catch(() => null)
    : null;
  const priceData = await getSubscriptionPrices().catch(() => null);
  const formattedProPrice = priceData ? new Intl.NumberFormat("fr-FR").format(priceData.proPriceXof) : "1 000";
  const formattedProPlusPrice = priceData
    ? new Intl.NumberFormat("fr-FR").format(priceData.proPlusPriceXof)
    : "10 000";

  const effectivePlan = getEffectivePlan(shop.plan, shop.planExpiresAt);
  const isPro = effectivePlan === "pro";
  const isProPlus = effectivePlan === "pro_plus";
  const isPaid = isPro || isProPlus;

  const daysRemaining = getProDaysRemaining(shop.plan, shop.planExpiresAt);
  // Les abonnements Pro+ annuels déjà accordés gardent leur échéance historique.
  const proPlusStatusPeriodDays = daysRemaining !== null && daysRemaining > 30 ? 365 : 30;
  const urgency = getProUrgency(shop.plan, shop.planExpiresAt);

  // Format expiry date for display (Senegal TZ)
  const expiryFormatted = shop.planExpiresAt
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Dakar",
      }).format(
        typeof shop.planExpiresAt === "number"
          ? new Date(shop.planExpiresAt > 1e12 ? shop.planExpiresAt : shop.planExpiresAt * 1000)
          : new Date(shop.planExpiresAt)
      )
    : null;

  // Urgency visual tokens
  const urgencyConfig = {
    ok: {
      dotColor: "#0E7C66",
      badgeBg: "#D9F1E9",
      badgeText: "#075F4D",
      label: "Actif",
      progressColor: "#0E7C66",
    },
    warning: {
      dotColor: "#B4531E",
      badgeBg: "#FEF3D6",
      badgeText: "#8A5A00",
      label: "Expire bientôt",
      progressColor: "#FFC83D",
    },
    critical: {
      dotColor: "#C8265A",
      badgeBg: "#FCE7EC",
      badgeText: "#C8265A",
      label: "Urgent",
      progressColor: "#C8265A",
    },
    expired: {
      dotColor: "#C8265A",
      badgeBg: "#FCE7EC",
      badgeText: "#C8265A",
      label: "Expiré",
      progressColor: "#C8265A",
    },
  } as const;

  const uConfig = urgency ? urgencyConfig[urgency] : null;

  // 1. CARTE GRATUIT
  const GratuitCard = () => (
    <div
      className={`p-6 rounded-3xl border-[2.5px] border-ink flex items-center relative overflow-hidden transition-opacity ${
        isPaid ? "bg-[#FFFBF2]/90 opacity-75" : "bg-[#FFFBF2]"
      }`}
    >
      {!isPaid && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-sun px-3 py-1 text-xs font-black text-ink shadow-[2px_2px_0_#0F1E3D]">
            Plan actuel
          </span>
        </div>
      )}
      <div className="w-16 h-16 rounded-full border-[2.5px] border-ink flex items-center justify-center bg-white mr-4 shrink-0">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F1E3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      </div>
      <div>
        <h2 className="font-bricolage font-black text-ink text-2xl mb-1">Gratuit</h2>
        <p className="font-bold text-ink/70 text-sm">Jusqu'à 10 produits, 1 photo par produit.</p>
        {isPaid && (
          <p className="mt-1 text-xs font-medium text-[#3F4B69]">
            Votre boutique repassera automatiquement sur ce plan si vous ne renouvelez pas.
          </p>
        )}
      </div>
    </div>
  );

  // 2. CARTE PRO (MENSUELLE)
  const ProCard = () => (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-[#EFCC6E] p-4 text-ink sm:rounded-[2rem] sm:p-6">
      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink bg-[#FDF9F2] sm:h-16 sm:w-16">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#151D3B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:h-[30px] sm:w-[30px]">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="font-bricolage text-xl font-black text-ink sm:text-2xl">PRO</h2>
              <span className="inline-flex rounded-full border border-[#DCCB9B] bg-[#FBF1D6] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] text-ink sm:px-2.5 sm:py-1 sm:text-[10px]">
                Mensuel
              </span>
            </div>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1 font-bold text-ink">
              <span className="text-lg sm:text-xl">{formattedProPrice} F</span>
              <span className="text-[11px] font-medium text-[#5B5640] sm:text-xs">/ mois, sans engagement</span>
            </p>
          </div>
        </div>
        {isPro && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 py-1.5 text-[11px] font-black text-[#EFCC6E] sm:px-3 sm:text-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Plan Actif
          </span>
        )}
      </div>

      <div className="my-3 border-t border-ink/15 sm:my-4" aria-hidden="true" />
      <ul className="mb-4 space-y-2 sm:mb-6 sm:space-y-2.5">
        <li className="flex items-start gap-2.5 font-bold text-[13px] text-ink sm:text-sm">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[#EFCC6E] sm:h-[18px] sm:w-[18px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:h-3 sm:w-3"><polyline points="20 6 9 17 4 12" /></svg></span>
          Jusqu'à 100 produits en ligne
        </li>
        <li className="flex items-start gap-2.5 font-bold text-[13px] text-ink sm:text-sm">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[#EFCC6E] sm:h-[18px] sm:w-[18px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:h-3 sm:w-3"><polyline points="20 6 9 17 4 12" /></svg></span>
          Jusqu'à 3 photos par produit
        </li>
        <li className="flex items-start gap-2.5 font-bold text-[13px] text-ink sm:text-sm">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[#EFCC6E] sm:h-[18px] sm:w-[18px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:h-3 sm:w-3"><polyline points="20 6 9 17 4 12" /></svg></span>
          Badge vérifié Jaayma sur le logo de la boutique
        </li>
        <li className="flex items-start gap-2.5 font-bold text-[13px] text-ink sm:text-sm">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[#EFCC6E] sm:h-[18px] sm:w-[18px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:h-3 sm:w-3"><polyline points="20 6 9 17 4 12" /></svg></span>
          Outils marketing : pixels Meta/TikTok et catalogue XML
        </li>
      </ul>

      {/* BLOC STATUT PRO (visible quand l'utilisateur est abonné à PRO) */}
      {isPro && uConfig && daysRemaining !== null && expiryFormatted && (
        <div className="mb-4 rounded-2xl border-[2.5px] border-ink bg-[#FDF9F2] p-3 text-ink shadow-[4px_4px_0_#151D3B] sm:mb-6 sm:p-4 sm:shadow-[5px_5px_0_#151D3B]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: uConfig.dotColor }}
              />
              <p className="font-bricolage text-[13px] font-black text-ink sm:text-[15px]">Statut Pro (30j)</p>
            </div>
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full border border-ink/20"
              style={{ backgroundColor: uConfig.badgeBg, color: uConfig.badgeText }}
            >
              {uConfig.label}
            </span>
          </div>

          <div className="mb-3">
            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: "#151D3B18" }}
              role="progressbar"
              aria-label="Jours restants"
              aria-valuemin={0}
              aria-valuemax={30}
              aria-valuenow={Math.min(daysRemaining, 30)}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.min(100, (daysRemaining / 30) * 100)}%`,
                  backgroundColor: uConfig.progressColor,
                }}
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-ink">
                {daysRemaining > 0 ? (
                  <>
                    <span className="font-bricolage font-black text-lg" style={{ color: uConfig.dotColor }}>
                      {daysRemaining}
                    </span>
                    {" "}jour{daysRemaining > 1 ? "s" : ""} restant{daysRemaining > 1 ? "s" : ""}
                  </>
                ) : (
                  <span style={{ color: "#C8265A" }}>Abonnement expiré</span>
                )}
              </p>
              <p className="text-xs font-medium text-[#5B647A] mt-0.5">
                {daysRemaining > 0 ? `Actif jusqu'au ${expiryFormatted}` : `Expiré le ${expiryFormatted}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BOUTONS PAIEMENT OU PROLONGATION PRO */}
      {isPro ? (
        <div className="space-y-2.5 border-t border-ink/15 pt-3 sm:space-y-3 sm:pt-4">
          <div className="rounded-2xl border-[2.5px] border-ink bg-[#FBF1D6] p-3 text-center shadow-[3px_3px_0_#151D3B] sm:p-3.5 sm:shadow-[4px_4px_0_#151D3B]">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-ink">
              Prolonger mon Pro (30 jours)
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs font-medium text-[#5B647A]">
              {daysRemaining !== null && daysRemaining > 0
                ? "Ajoutez 30 jours à votre échéance actuelle. Aucun jour n'est perdu."
                : "Renouvelez pour réactiver votre accès Pro immédiatement."}
            </p>
          </div>
          <SubscriptionPaymentButtons price={formattedProPrice} isRenewal plan="pro" />
        </div>
      ) : !isProPlus ? (
        <div className="space-y-2.5 border-t border-ink/15 pt-3 sm:space-y-3 sm:pt-4">
          <SubscriptionPaymentButtons price={formattedProPrice} plan="pro" />
          <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-[#5B5640]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Paiement sécurisé · 30 jours de Pro
          </p>
        </div>
      ) : (
        <div className="border-t border-ink/15 pt-3 sm:pt-4">
          <div className="rounded-2xl border-[2.5px] border-ink bg-[#FBF1D6] p-3 text-center shadow-[3px_3px_0_#151D3B] sm:p-3.5 sm:shadow-[4px_4px_0_#151D3B]">
            <p className="text-xs font-bold text-ink">
              Vous bénéficiez déjà de la formule supérieure <span className="font-black text-[#0F1E3D]">Pro+</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // 3. CARTE PRO+ (MENSUELLE)
  const ProPlusCard = () => (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-[#EFCC6E] p-4 text-ink sm:rounded-[2rem] sm:p-6">
      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[2.5px] border-ink bg-[#FDF9F2] sm:h-16 sm:w-16">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#151D3B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:h-[30px] sm:w-[30px]">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="font-bricolage text-xl font-black text-ink sm:text-2xl">PRO+</h2>
              <span className="inline-flex rounded-full border border-[#DCCB9B] bg-[#FBF1D6] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] text-ink sm:px-2.5 sm:py-1 sm:text-[10px]">
                Mensuel
              </span>
            </div>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1 font-bold text-ink">
              <span className="text-lg sm:text-xl">{formattedProPlusPrice} F</span>
              <span className="text-[11px] font-medium text-[#5B5640] sm:text-xs">/ mois</span>
            </p>
          </div>
        </div>
        {isProPlus && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-2.5 py-1.5 text-[11px] font-black text-[#EFCC6E] sm:px-3 sm:text-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Plan Actif
          </span>
        )}
      </div>

      <div className="my-3 border-t border-ink/15 sm:my-4" aria-hidden="true" />
      <ul className="mb-4 space-y-2 text-ink sm:mb-6 sm:space-y-2.5">
        <li className="flex items-start gap-2.5 font-bold text-[13px] sm:text-sm">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[#EFCC6E] sm:h-[18px] sm:w-[18px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:h-3 sm:w-3"><polyline points="20 6 9 17 4 12" /></svg></span>
          Jusqu'à 200 produits en ligne
        </li>
        <li className="flex items-start gap-2.5 font-bold text-[13px] sm:text-sm">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[#EFCC6E] sm:h-[18px] sm:w-[18px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:h-3 sm:w-3"><polyline points="20 6 9 17 4 12" /></svg></span>
          Jusqu'à 4 photos par produit
        </li>
        <li className="flex items-start gap-2.5 font-bold text-[13px] sm:text-sm">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[#EFCC6E] sm:h-[18px] sm:w-[18px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:h-3 sm:w-3"><polyline points="20 6 9 17 4 12" /></svg></span>
          Badge vérifié Jaayma Pro+ sur le logo de la boutique
        </li>
        <li className="flex items-start gap-2.5 font-bold text-[13px] sm:text-sm">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[#EFCC6E] sm:h-[18px] sm:w-[18px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:h-3 sm:w-3"><polyline points="20 6 9 17 4 12" /></svg></span>
          Boutique et produits mis en avant dans les recherches Explorer
        </li>
        <li className="flex items-start gap-2.5 font-bold text-[13px] sm:text-sm">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[#EFCC6E] sm:h-[18px] sm:w-[18px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:h-3 sm:w-3"><polyline points="20 6 9 17 4 12" /></svg></span>
          Outils marketing : pixels Meta/TikTok et catalogue XML
        </li>
        <li className="flex items-start gap-2.5 font-bold text-[13px] sm:text-sm">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-[#EFCC6E] sm:h-[18px] sm:w-[18px]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:h-3 sm:w-3"><polyline points="20 6 9 17 4 12" /></svg></span>
          Paiement mensuel · Accès valable 30 jours
        </li>
      </ul>

      {/* BLOC STATUT PRO+ (visible quand l'utilisateur est abonné à PRO+) */}
      {isProPlus && uConfig && daysRemaining !== null && expiryFormatted && (
        <div className="mb-4 rounded-2xl border-[2.5px] border-ink bg-[#FDF9F2] p-3 text-ink shadow-[4px_4px_0_#151D3B] sm:mb-6 sm:p-4 sm:shadow-[5px_5px_0_#151D3B]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: uConfig.dotColor }}
              />
              <p className="font-bricolage text-[13px] font-black text-ink sm:text-[15px]">Statut Pro+</p>
            </div>
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full border border-ink/20"
              style={{ backgroundColor: uConfig.badgeBg, color: uConfig.badgeText }}
            >
              {uConfig.label}
            </span>
          </div>

          <div className="mb-3">
            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: "#151D3B18" }}
              role="progressbar"
              aria-label="Jours restants"
              aria-valuemin={0}
              aria-valuemax={proPlusStatusPeriodDays}
              aria-valuenow={Math.min(daysRemaining, proPlusStatusPeriodDays)}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.min(100, (daysRemaining / proPlusStatusPeriodDays) * 100)}%`,
                  backgroundColor: uConfig.progressColor,
                }}
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-ink">
                {daysRemaining > 0 ? (
                  <>
                    <span className="font-bricolage font-black text-lg" style={{ color: uConfig.dotColor }}>
                      {daysRemaining}
                    </span>
                    {" "}jour{daysRemaining > 1 ? "s" : ""} restant{daysRemaining > 1 ? "s" : ""}
                  </>
                ) : (
                  <span style={{ color: "#C8265A" }}>Abonnement expiré</span>
                )}
              </p>
              <p className="text-xs font-medium text-[#5B647A] mt-0.5">
                {daysRemaining > 0 ? `Actif jusqu'au ${expiryFormatted}` : `Expiré le ${expiryFormatted}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BOUTONS PAIEMENT OU PROLONGATION PRO+ */}
      {isProPlus ? (
        <div className="space-y-2.5 border-t border-ink/15 pt-3 sm:space-y-3 sm:pt-4">
          <div className="rounded-2xl border-[2.5px] border-ink bg-[#FBF1D6] p-3 text-center shadow-[3px_3px_0_#151D3B] sm:p-3.5 sm:shadow-[4px_4px_0_#151D3B]">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-ink">
              Prolonger mon Pro+ (1 mois)
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs font-medium text-[#5B647A]">
              {daysRemaining !== null && daysRemaining > 0
                ? "Ajoutez 30 jours à votre échéance actuelle. Aucun jour n'est perdu."
                : "Renouvelez pour 30 jours supplémentaires."}
            </p>
          </div>
          <SubscriptionPaymentButtons price={formattedProPlusPrice} isRenewal plan="pro_plus" />
        </div>
      ) : isPro ? (
        <div className="space-y-2.5 border-t border-ink/15 pt-3 sm:space-y-3 sm:pt-4">
          <div className="rounded-2xl border-[2.5px] border-ink bg-[#FBF1D6] p-3 text-center shadow-[3px_3px_0_#151D3B] sm:p-3.5 sm:shadow-[4px_4px_0_#151D3B]">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-ink">
              Passer à la formule Pro+ (1 mois)
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs font-medium text-[#5B647A]">
              Débloquez 200 produits et 4 photos par produit pendant 30 jours. Vos jours Pro restants sont conservés.
            </p>
          </div>
          <SubscriptionPaymentButtons price={formattedProPlusPrice} plan="pro_plus" />
        </div>
      ) : (
        <div className="space-y-2.5 border-t border-ink/15 pt-3 sm:space-y-3 sm:pt-4">
          <SubscriptionPaymentButtons price={formattedProPlusPrice} plan="pro_plus" />
          <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-[#5B5640]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Paiement mensuel · Valable 30 jours
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto min-h-screen max-w-xl p-5 pb-28 md:max-w-5xl md:px-8 xl:max-w-[1400px]" style={{ backgroundColor: "#0F1E3D" }}>
      {/*  HEADER  */}
      <div className="mb-8 mt-4">
        <p className="text-sm font-medium mb-1" style={{ color: "#C3CCE6" }}>Ton plan</p>
        <h1 className="font-bricolage font-black leading-none" style={{ color: "#FFC83D", fontSize: "clamp(2rem, 8vw, 2.5rem)", letterSpacing: "-0.02em" }}>
          Abonnement
        </h1>
      </div>

      {params.erreur === "paiement" && (
        <div className="mb-5 rounded-2xl border-2 border-ink bg-[#FFFBF2] p-4" role="alert">
          <p className="font-bricolage font-black text-[#C8265A]">Le paiement n'a pas pu démarrer</p>
          <p className="mt-1 text-sm font-medium text-ink/75">Réessayez dans un instant. Si le problème persiste, le paiement en ligne doit peut-être encore être configuré.</p>
        </div>
      )}

      {paymentId && payment && (
        <SubscriptionPaymentNotice
          paymentId={paymentId}
          initialStatus={payment.status}
          initialPlan={payment.plan}
          returnedCancelled={params.retour === "annule"}
        />
      )}

      <div className="space-y-5 md:grid md:grid-cols-2 md:items-start md:gap-5 md:space-y-0 xl:grid-cols-3">
        {/* L'ordre s'adapte à l'abonnement du vendeur */}
        {isProPlus ? (
          <>
            <ProPlusCard />
            <ProCard />
            <GratuitCard />
          </>
        ) : isPro ? (
          <>
            <ProCard />
            <ProPlusCard />
            <GratuitCard />
          </>
        ) : (
          <>
            <GratuitCard />
            <ProCard />
            <ProPlusCard />
          </>
        )}
      </div>
    </div>
  );
}
