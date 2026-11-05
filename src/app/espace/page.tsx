import { getCurrentSellerContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Box,
  CheckCircle2,
  Circle,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  PackagePlus,
  Sparkles,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { formatFcfa } from "@/lib/money";
import { getRequestOrigin } from "@/lib/site-url";
import { getImageUrl } from "@/lib/images";
import { listOrdersByShop } from "@/services/order.service";
import { listProductsByShop } from "@/services/product.service";
import { getEffectivePlan, getProDaysRemaining, getProUrgency } from "@/lib/plans";
import type { Order } from "@/types/schema";
import ShareShopButton from "./ShareShopButton";
import ShopQrCode from "./ShopQrCode";

export const metadata = {
  title: "Accueil - Espace Vendeur Jaaymaa",
};

const CARD_CLASS =
  "rounded-[22px] border-[2.5px] border-ink bg-[#FFFBF2] text-ink shadow-[4px_4px_0_#0F1E3D]";

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <article className={`${CARD_CLASS} flex flex-col justify-between p-4 sm:p-5`}>
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#3F4B69] leading-tight">
          {label}
        </p>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink"
          style={{ backgroundColor: accent }}
        >
          {icon}
        </span>
      </div>
      {/* Middle: big value */}
      <p className="mt-3 break-words font-bricolage text-2xl font-black leading-none tracking-tight sm:text-3xl">
        {value}
      </p>
      {/* Bottom: hint */}
      <p className="mt-3 border-t border-ink/10 pt-2.5 text-[11px] font-semibold text-[#3F4B69]">
        {hint}
      </p>
    </article>
  );
}

function getDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function toDate(value: string | number | Date) {
  return value instanceof Date ? value : new Date(value);
}

export default async function DashboardPage() {
  const [sellerContext, siteOrigin] = await Promise.all([
    getCurrentSellerContext(),
    getRequestOrigin(),
  ]);
  if (!sellerContext) redirect("/connexion");
  const { shop } = sellerContext;

  if (!shop) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-5xl items-center px-5 py-10 md:px-8 lg:px-10 xl:max-w-[1400px]">
        <section className={`${CARD_CLASS} w-full overflow-hidden`}>
          <div className="grid gap-8 bg-[#FFC83D] p-6 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-[#FFFBF2] px-3 py-1 text-xs font-black uppercase tracking-[0.1em]">
                <Store size={14} /> Espace vendeur
              </span>
              <h1 className="mt-5 font-bricolage text-4xl font-black leading-[0.98] tracking-tight sm:text-5xl">
                Bienvenue sur Jaaymaa.
              </h1>
              <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-[#273756] sm:text-base">
                Crée ta boutique pour publier tes produits, recevoir tes commandes et partager ton lien avec tes clients.
              </p>
              <Link
                href="/espace/boutique"
                className="mt-7 inline-flex items-center gap-2 rounded-full border-[2.5px] border-ink bg-[#0F1E3D] px-6 py-3.5 text-sm font-black text-white shadow-[4px_4px_0_#0F1E3D] transition-transform hover:-translate-y-0.5"
              >
                Créer ma boutique <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="hidden justify-center lg:flex">
              <div className="flex h-48 w-48 rotate-3 items-center justify-center rounded-[38px] border-[3px] border-ink bg-[#FFFBF2] shadow-[8px_8px_0_#0F1E3D]">
                <Store size={76} strokeWidth={1.6} />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const [ordersList, products] = await Promise.all([
    listOrdersByShop(shop.id, sellerContext.sellerId),
    listProductsByShop(shop.id),
  ]);

  // Dakar is UTC+0, so UTC midnight gives the correct Senegal business day.
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);
  const todayKey = getDateKey(startOfToday);

  const paidOrders = ordersList.filter(
    (order) => String(order.paymentStatus).toLowerCase() === "paid"
  );
  const todayRevenue = paidOrders
    .filter((order) => {
      const createdAt = toDate(order.createdAt).getTime();
      return createdAt >= startOfToday.getTime() && createdAt < startOfTomorrow.getTime();
    })
    .reduce((sum, order) => sum + (order.total || 0), 0);

  const todayOrders = ordersList.filter((order) => {
    const createdAt = toDate(order.createdAt).getTime();
    return createdAt >= startOfToday.getTime() && createdAt < startOfTomorrow.getTime();
  }).length;

  const actionableStatuses = new Set(["new", "confirmed", "preparing"]);
  const pendingOrders = ordersList
    .filter((order) => actionableStatuses.has(String(order.status).toLowerCase()))
    .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
  const activeProducts = products.filter((product) => product.isActive).length;

  const setupSteps = [
    {
      id: "profile",
      title: "Présente ta boutique",
      description: "Ajoute une catégorie, un logo et ton WhatsApp.",
      complete: Boolean(shop.category && (shop.logoUrl || shop.logoKey) && shop.whatsapp),
      href: "/espace/boutique#profile-settings",
      icon: <Store size={18} />,
    },
    {
      id: "product",
      title: "Mets un produit en ligne",
      description: "Ajoute au moins un article avec un prix clair.",
      complete: activeProducts > 0,
      href: "/espace/produits/nouveau",
      icon: <PackagePlus size={18} />,
    },
    {
      id: "payment-delivery",
      title: "Règle paiement et livraison",
      description: "Choisis un paiement et précise comment tu livres.",
      complete: Boolean(
        (shop.acceptsCash || shop.wavePaymentLink || shop.waveNumber || shop.orangeMoneyNumber) &&
          shop.deliveryNote?.trim()
      ),
      href: "/espace/boutique#payment-settings",
      icon: <CreditCard size={18} />,
    },
    {
      id: "publish",
      title: "Publie ta boutique",
      description: "Ton lien devient accessible à tes clients.",
      complete: Boolean(shop.isPublished),
      href: "/espace/boutique#publication-settings",
      icon: <Truck size={18} />,
    },
  ];
  const completedSetupSteps = setupSteps.filter((step) => step.complete).length;
  const setupProgress = Math.round((completedSetupSteps / setupSteps.length) * 100);

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfToday);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    return { date, key: getDateKey(date) };
  });
  const revenueByDay = new Map<string, number>();
  for (const order of paidOrders) {
    const key = getDateKey(toDate(order.createdAt));
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + (order.total || 0));
  }
  const weeklyRevenue = weekDays.map(({ date, key }) => ({
    key,
    date,
    amount: revenueByDay.get(key) ?? 0,
    isToday: key === todayKey,
  }));
  const maxRevenue = Math.max(1, ...weeklyRevenue.map((day) => day.amount));
  const totalWeekRevenue = weeklyRevenue.reduce((sum, day) => sum + day.amount, 0);

  const last30DaysStart = new Date(startOfToday);
  last30DaysStart.setUTCDate(last30DaysStart.getUTCDate() - 29);
  const last30DaysOrders = ordersList.filter(
    (order) => toDate(order.createdAt).getTime() >= last30DaysStart.getTime()
  );
  const deliveredLast30Days = last30DaysOrders.filter(
    (order) => String(order.status).toLowerCase() === "delivered"
  ).length;
  const cancelledLast30Days = last30DaysOrders.filter(
    (order) => String(order.status).toLowerCase() === "cancelled"
  ).length;

  const recentOrders = pendingOrders.slice(0, 4);
  const shopUrl = `${new URL(siteOrigin).host}/${shop.slug}`;
  const fullUrl = `${siteOrigin}/${shop.slug}`;
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Dakar",
  }).format(now);

  const effectivePlan = getEffectivePlan(shop.plan, shop.planExpiresAt);
  const isPaid = effectivePlan === "pro" || effectivePlan === "pro_plus";
  const planLabel = effectivePlan === "pro_plus" ? "Plan Pro+" : effectivePlan === "pro" ? "Plan Pro" : "Plan Gratuit";
  const subscriptionLabel = shop.plan === "pro_plus" ? "Pro+" : "Pro";
  const subscriptionPhotoLimit = shop.plan === "pro_plus" ? 4 : 3;
  const proDaysRemaining = getProDaysRemaining(shop.plan, shop.planExpiresAt);
  const proUrgency = getProUrgency(shop.plan, shop.planExpiresAt);
  const showRenewalBanner = proUrgency === "warning" || proUrgency === "critical" || proUrgency === "expired";

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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-7 md:px-8 lg:px-10 xl:max-w-[1500px]">
      <section className="overflow-hidden rounded-[26px] border-[2.5px] border-ink bg-[#FFC83D] shadow-[5px_5px_0_#0F1E3D]">
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end lg:p-9">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border-2 border-ink bg-[#FFFBF2] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-ink">
                Espace vendeur
              </span>
              <span className="text-xs font-bold capitalize text-[#3F4B69]">{formattedDate}</span>
            </div>
            <h1 className="mt-4 font-bricolage text-3xl font-black leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Bonjour, {shop.name.split(" ")[0]}.
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-[#273756] sm:text-base">
              Voici les dernières nouvelles de ta boutique <span className="font-black">{shop.name}</span>.
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border-2 border-ink px-3 py-2 text-xs font-black ${
                shop.isPublished ? "bg-[#D9F1E9] text-[#075F4D]" : "bg-[#FFFBF2] text-[#3F4B69]"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${shop.isPublished ? "bg-[#0E7C66]" : "bg-[#C8265A]"}`} />
              {shop.isPublished ? "Boutique en ligne" : "Boutique non publiée"}
            </span>
            <Link
              href="/espace/abonnement"
              className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-2 text-xs font-black transition-transform hover:-translate-y-0.5 ${
                isPaid
                  ? "bg-[#0F1E3D] text-[#FFC83D]"
                  : "bg-[#FFFBF2] text-[#3F4B69]"
              }`}
            >
              <Sparkles size={13} className={isPaid ? "text-[#FFC83D]" : "text-[#B4531E]"} />
              {planLabel}
            </Link>
            <a
              href={`${fullUrl}?from=seller`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-[2.5px] border-ink bg-[#0F1E3D] px-4 py-2.5 text-sm font-black text-[#FFFBF2] shadow-[3px_3px_0_#0F1E3D] transition-transform hover:-translate-y-0.5"
            >
              Voir ma boutique <ExternalLink size={15} />
            </a>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full border-[24px] border-[#0F1E3D]/[0.06] sm:-right-2 sm:-top-28 sm:h-72 sm:w-72" />
        </div>
      </section>

      {showRenewalBanner && (
        <section
          role="alert"
          className={`overflow-hidden rounded-[22px] border-[2.5px] border-ink p-5 sm:p-6 shadow-[4px_4px_0_#0F1E3D] ${
            proUrgency === "expired" || proUrgency === "critical"
              ? "bg-[#FFF2F4]"
              : "bg-[#FFF9E6]"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-ink shadow-[2px_2px_0_#0F1E3D] ${
                  proUrgency === "expired" || proUrgency === "critical"
                    ? "bg-[#C8265A] text-white"
                    : "bg-[#FFC83D] text-ink"
                }`}
              >
                {proUrgency === "expired" || proUrgency === "critical" ? (
                  <AlertTriangle size={22} strokeWidth={2.4} />
                ) : (
                  <Clock3 size={22} strokeWidth={2.4} />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                      proUrgency === "expired" || proUrgency === "critical"
                        ? "bg-[#C8265A] text-white"
                        : "bg-[#FEF3D6] text-[#8A5A00]"
                    }`}
                  >
                    {proUrgency === "expired"
                      ? `Abonnement ${subscriptionLabel} expiré`
                      : proUrgency === "critical"
                      ? `Expire dans ${proDaysRemaining} jour${(proDaysRemaining ?? 0) > 1 ? "s" : ""}`
                      : `Expire dans ${proDaysRemaining} jours`}
                  </span>
                  {expiryFormatted && (
                    <span className="text-xs font-semibold text-[#3F4B69]">
                      {proUrgency === "expired" ? `Depuis le ${expiryFormatted}` : `Échéance le ${expiryFormatted}`}
                    </span>
                  )}
                </div>
                <h2 className="mt-1 font-bricolage text-lg font-black text-ink sm:text-xl">
                  {proUrgency === "expired"
                    ? `Ton abonnement ${subscriptionLabel} a pris fin`
                    : proUrgency === "critical"
                    ? `Renouvellement ${subscriptionLabel} urgent`
                    : `Pense à renouveler ton abonnement ${subscriptionLabel}`}
                </h2>
                <p className="mt-1 text-xs font-medium leading-5 text-[#273756] sm:text-sm">
                  {proUrgency === "expired"
                    ? `Tes fonctionnalités ${subscriptionLabel} sont en pause (jusqu'à ${subscriptionPhotoLimit} photos par produit, visibilité standard). Renouvelle dès aujourd'hui pour réactiver tes avantages.`
                    : proUrgency === "critical"
                    ? `Il ne te reste que quelques jours pour conserver jusqu'à ${subscriptionPhotoLimit} photos par produit et ton badge ${subscriptionLabel} sans interruption.`
                    : `Prolonge ton abonnement ${subscriptionLabel} via Wave ou Orange Money pour continuer à profiter de tes avantages.`}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center">
              <Link
                href="/espace/abonnement"
                className={`inline-flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink px-5 py-2.5 text-xs font-black shadow-[3px_3px_0_#0F1E3D] transition-transform hover:-translate-y-0.5 sm:text-sm ${
                  proUrgency === "expired" || proUrgency === "critical"
                    ? "bg-[#C8265A] text-white"
                    : "bg-[#0F1E3D] text-[#FFC83D]"
                }`}
              >
                {proUrgency === "expired" ? `Réactiver mon ${subscriptionLabel}` : `Prolonger mon ${subscriptionLabel}`}
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {completedSetupSteps < setupSteps.length && (
        <section className={`${CARD_CLASS} overflow-hidden`} aria-labelledby="setup-title">
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#C8265A]">Démarrage guidé</p>
              <h2 id="setup-title" className="mt-1 font-bricolage text-xl font-black sm:text-2xl">
                Prépare ta boutique à recevoir sa première commande
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#3F4B69]">
                Quelques réglages aident tes clients à te trouver, choisir et commander en confiance.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-[#0F1E3D]/10"
                  role="progressbar"
                  aria-label="Progression de la configuration"
                  aria-valuemin={0}
                  aria-valuemax={setupSteps.length}
                  aria-valuenow={completedSetupSteps}
                >
                  <div
                    className="h-full rounded-full bg-[#0E7C66] transition-[width]"
                    style={{ width: `${setupProgress}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs font-black text-[#3F4B69]">
                  {completedSetupSteps}/{setupSteps.length}
                </span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {setupSteps.map((step) => (
                <Link
                  key={step.id}
                  href={step.href}
                  className={`flex min-h-[92px] items-start gap-3 rounded-2xl border-2 p-3 transition-colors ${
                    step.complete
                      ? "border-[#0E7C66]/20 bg-[#E8F5EF]"
                      : "border-ink/10 bg-white hover:border-[#FFC83D]"
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 ${step.complete ? "text-[#0E7C66]" : "text-[#65708A]"}`}>
                    {step.complete ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-black">
                      <span className="text-[#65708A]">{step.icon}</span>
                      {step.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#65708A]">{step.description}</span>
                  </span>
                  {!step.complete && <ChevronRight size={16} className="mt-1 shrink-0 text-[#65708A]" />}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section aria-label="Indicateurs de la boutique" className="grid grid-cols-2 items-stretch gap-4 xl:grid-cols-4">
        <StatCard
          label="Ventes encaissées"
          value={formatFcfa(todayRevenue)}
          hint="Aujourd'hui"
          accent="#FFC83D"
          icon={<Wallet size={19} />}
        />
        <StatCard
          label="Commandes"
          value={String(todayOrders)}
          hint="Reçues aujourd'hui"
          accent="#F6C3D2"
          icon={<Box size={19} />}
        />
        <StatCard
          label="À traiter"
          value={String(pendingOrders.length)}
          hint="Nouvelles et en préparation"
          accent="#CFEFE6"
          icon={<Clock3 size={19} />}
        />
        <StatCard
          label="Produits en ligne"
          value={String(activeProducts)}
          hint={`${products.length} produit${products.length > 1 ? "s" : ""} au catalogue`}
          accent="#DCE5FF"
          icon={<BadgeCheck size={19} />}
        />
      </section>

      <section className={`${CARD_CLASS} p-5 sm:p-6`} aria-labelledby="last-30-days-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#C8265A]">Suivi de l’activité</p>
            <h2 id="last-30-days-title" className="mt-1 font-bricolage text-xl font-black">30 derniers jours</h2>
          </div>
          <Link href="/espace/commandes" className="text-xs font-black text-[#0F1E3D] underline decoration-[#FFC83D] decoration-2 underline-offset-4">
            Voir toutes les commandes
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "Commandes reçues", value: last30DaysOrders.length, tone: "bg-[#DCE5FF]" },
            { label: "Livrées", value: deliveredLast30Days, tone: "bg-[#CFEFE6]" },
            { label: "Annulées", value: cancelledLast30Days, tone: "bg-[#F6C3D2]" },
          ].map((metric) => (
            <div key={metric.label} className={`rounded-2xl border-2 border-ink/10 p-3 sm:p-4 ${metric.tone}`}>
              <p className="font-bricolage text-2xl font-black leading-none sm:text-3xl">{metric.value}</p>
              <p className="mt-2 text-[10px] font-black leading-4 text-[#3F4B69] sm:text-xs">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <article className={`${CARD_CLASS} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#C8265A]">Activité</p>
              <h2 className="mt-1 font-bricolage text-xl font-black sm:text-2xl">Ventes des 7 derniers jours</h2>
            </div>
            <p className="rounded-full border-2 border-ink bg-[#F4F0E7] px-3 py-1.5 text-xs font-bold text-[#3F4B69]">
              {formatFcfa(totalWeekRevenue)} sur 7 jours
            </p>
          </div>

          <div className="mt-7 flex h-40 items-end gap-2 sm:gap-3">
            {weeklyRevenue.map((day) => {
              const height = day.amount > 0 ? Math.max(10, (day.amount / maxRevenue) * 100) : 4;
              const dayLabel = new Intl.DateTimeFormat("fr-FR", {
                weekday: "short",
                timeZone: "Africa/Dakar",
              })
                .format(day.date)
                .replace(".", "");

              return (
                <div key={day.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex w-full flex-1 items-end overflow-hidden rounded-t-xl bg-[#F0EDE8]">
                    <div
                      title={`${dayLabel}: ${formatFcfa(day.amount)}`}
                      className={`w-full rounded-t-xl border-x border-t border-ink transition-[height] ${day.isToday ? "bg-[#FFC83D]" : "bg-[#CFEFE6]"}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-black uppercase sm:text-xs ${day.isToday ? "text-[#C8265A]" : "text-[#65708A]"}`}>
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 border-t border-ink/15 pt-3 text-xs font-medium text-[#3F4B69]">
            Les montants affichés correspondent aux commandes marquées comme payées.
          </p>
        </article>

        <article className={`${CARD_CLASS} p-5 sm:p-6`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#C8265A]">Priorité</p>
              <h2 className="mt-1 font-bricolage text-xl font-black sm:text-2xl">Commandes à traiter</h2>
            </div>
            <span className="flex h-10 min-w-10 items-center justify-center rounded-full border-2 border-ink bg-[#FFC83D] px-2 text-sm font-black">
              {pendingOrders.length}
            </span>
          </div>

          {recentOrders.length === 0 ? (
            <div className="mt-5 rounded-2xl border-2 border-dashed border-ink/25 bg-white/60 px-4 py-8 text-center">
              <BadgeCheck className="mx-auto text-[#0E7C66]" size={26} />
              <p className="mt-2 text-sm font-bold">Tout est à jour.</p>
              <p className="mt-1 text-xs text-[#65708A]">Les nouvelles commandes apparaîtront ici.</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-ink/10">
              {recentOrders.map((order: Order) => {
                const status = String(order.status).toLowerCase();
                const badge = status === "new"
                  ? { label: "Nouvelle", className: "bg-[#F6C3D2] text-[#8C1C41]" }
                  : status === "preparing"
                    ? { label: "En préparation", className: "bg-[#DCE5FF] text-[#263B70]" }
                    : { label: "Confirmée", className: "bg-[#CFEFE6] text-[#075F4D]" };

                return (
                  <Link
                    key={order.id}
                    href={`/espace/commandes/${order.id}`}
                    className="group flex items-center gap-3 py-3 first:pt-1 last:pb-1"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-[#FFC83D] font-bricolage text-xs font-black">
                      {order.customerName.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-black">{order.customerName}</span>
                        <span className="shrink-0 text-xs font-black">{formatFcfa(order.total)}</span>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] text-[#65708A]">{order.reference}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${badge.className}`}>
                          {badge.label}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="shrink-0 text-[#65708A] transition-transform group-hover:translate-x-0.5" size={17} />
                  </Link>
                );
              })}
            </div>
          )}

          <Link
            href="/espace/commandes"
            className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#0F1E3D] underline decoration-[#FFC83D] decoration-[3px] underline-offset-4"
          >
            Ouvrir les commandes <ArrowUpRight size={15} />
          </Link>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className={`${CARD_CLASS} grid gap-4 p-4 sm:grid-cols-[164px_minmax(0,1fr)] sm:p-5`}>
          <ShopQrCode
            shopName={shop.name}
            shopUrl={fullUrl}
            themeColor={shop.themeColor}
            shopLogoUrl={getImageUrl(shop.logoKey ?? shop.logoUrl)}
          />
          <div className="flex min-w-0 flex-col justify-center py-1 sm:py-2">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#C8265A]">À partager</p>
              <h2 className="mt-1 font-bricolage text-xl font-black">Le lien de ta boutique</h2>
              <p className="mt-2 break-all rounded-xl border border-ink/15 bg-white/70 px-3 py-2 text-sm font-bold text-[#3F4B69]">
                {shopUrl}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <ShareShopButton shopName={shop.name} shopUrl={fullUrl} />
              <a
                href={`${fullUrl}?from=seller`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-white px-4 py-3 text-sm font-black shadow-[3px_3px_0_#0F1E3D] transition-transform hover:-translate-y-0.5"
              >
                Voir ma boutique <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </article>

        <article className="rounded-[22px] border-[2.5px] border-ink bg-[#0F1E3D] p-5 text-white shadow-[4px_4px_0_#FFC83D] sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#FFC83D]">Raccourcis</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/espace/produits/nouveau"
              className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-bold transition-colors hover:border-[#FFC83D]/60 hover:bg-white/10"
            >
              <span className="flex items-center gap-3"><PackagePlus size={18} className="text-[#FFC83D]" /> Ajouter un produit</span>
              <ChevronRight size={16} className="shrink-0 text-white/50" />
            </Link>
            <Link
              href="/espace/boutique"
              className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-bold transition-colors hover:border-[#FFC83D]/60 hover:bg-white/10"
            >
              <span className="flex items-center gap-3"><Store size={18} className="text-[#FFC83D]" /> Modifier ma boutique</span>
              <ChevronRight size={16} className="shrink-0 text-white/50" />
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
