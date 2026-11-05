import Link from "next/link";
import { AlertTriangle, BadgeCheck, CheckCircle2, Settings2, Zap } from "lucide-react";
import { getSessionToken } from "@/lib/auth";
import { getAdminSubscriptions } from "@/services/admin.service";
import { AdminError, AdminPageTitle, AdminPagination, adminPanelClass } from "../AdminUI";
import AdminFilterForm from "../AdminFilterForm";
import AdminShopRow from "../AdminShopRow";

export const metadata = { title: "Abonnements · Administration Jaaymaa" };
type SearchParams = Promise<{ q?: string; plan?: string; page?: string }>;

export default async function AdminSubscriptionsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = await getSessionToken();
  if (!token) return <AdminError message="Votre session a expiré. Reconnectez-vous." />;
  const query = params.q?.trim() || "";
  const requestedPlan = params.plan || "all";
  const plan = ["all", "pro", "pro_plus", "expired", "free"].includes(requestedPlan) ? requestedPlan : "all";
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  try {
    const overview = await getAdminSubscriptions({ q: query, plan, page });
    const makeHref = (nextPage: number) => {
      const search = new URLSearchParams();
      if (query) search.set("q", query);
      if (plan) search.set("plan", plan);
      search.set("page", String(nextPage));
      return `/admin/abonnements?${search}`;
    };
    const makePlanHref = (nextPlan: string) => {
      const search = new URLSearchParams();
      if (query) search.set("q", query);
      search.set("plan", nextPlan);
      return `/admin/abonnements?${search}`;
    };
    return (
      <>
        <AdminPageTitle eyebrow="Offre commerciale" title="Abonnements Pro et Pro+" description="Consultez les formules actives et expirées, changez le plan d’une boutique ou modifiez les tarifs depuis les réglages." action={<Link href="/admin/reglages" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-ink bg-papier px-3 py-2 text-xs font-black text-ink shadow-[2px_2px_0_#0F1E3D] transition-transform hover:-translate-y-0.5"><Settings2 size={14} />Modifier les tarifs</Link>} />

        <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <SubscriptionStat label="Pro actifs" value={overview.metrics.proShops} icon={<CheckCircle2 size={16} className="text-baobab" />} />
          <SubscriptionStat label="Pro+ actifs" value={overview.metrics.proPlusShops} icon={<BadgeCheck size={16} className="text-[#9A6500]" />} />
          <SubscriptionStat label="Pro expirés" value={overview.metrics.expiredProShops} icon={<AlertTriangle size={16} className="text-[#8A5A00]" />} />
          <SubscriptionStat label="Pro+ expirés" value={overview.metrics.expiredProPlusShops} icon={<AlertTriangle size={16} className="text-[#8A5A00]" />} />
          <SubscriptionStat label="Gratuit / expiré" value={Math.max(0, overview.metrics.totalShops - overview.metrics.proShops - overview.metrics.proPlusShops)} icon={<Zap size={16} className="text-muted" />} />
        </section>

        <section className={`${adminPanelClass()} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              <PlanTab href={makePlanHref("all")} active={plan === "all"}>Tous</PlanTab>
              <PlanTab href={makePlanHref("pro")} active={plan === "pro"}>Pro actifs</PlanTab>
              <PlanTab href={makePlanHref("pro_plus")} active={plan === "pro_plus"}>Pro+ actifs</PlanTab>
              <PlanTab href={makePlanHref("expired")} active={plan === "expired"}>Expirés</PlanTab>
              <PlanTab href={makePlanHref("free")} active={plan === "free"}>Gratuits</PlanTab>
            </div>
            <AdminFilterForm action="/admin/abonnements" className="flex w-full gap-2 sm:w-auto">
              <input type="hidden" name="plan" value={plan} />
              <input name="q" defaultValue={query} placeholder="Boutique ou vendeur…" className="min-w-0 flex-1 rounded-lg border border-ink/10 bg-[#FFFBF2] px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted/60 focus:border-sun sm:w-64" />
              <button className="rounded-lg border-2 border-ink bg-sun px-4 text-xs font-black text-ink">Rechercher</button>
            </AdminFilterForm>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[1050px] border-collapse text-left md:block md:min-w-0 2xl:table 2xl:min-w-[1050px]"><thead className="md:hidden 2xl:table-header-group"><tr className="bg-[#F0EDE8] text-[10px] font-black uppercase tracking-[0.13em] text-muted"><th className="px-4 py-3.5 sm:px-5">Boutique</th><th className="px-4 py-3.5">Vendeur</th><th className="px-4 py-3.5">Activité</th><th className="px-4 py-3.5">Abonnement</th><th className="px-4 py-3.5 text-right">Changer la formule</th></tr></thead><tbody className="md:grid md:grid-cols-2 md:gap-3 md:p-3 2xl:table-row-group 2xl:gap-0 2xl:p-0">
            {overview.shops.items.length === 0 ? <tr className="md:col-span-2 md:block 2xl:table-row"><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted md:block 2xl:table-cell">Aucune boutique dans cette catégorie.</td></tr> : overview.shops.items.map((shop) => {
              const isPaidPlan = shop.plan === "pro" || shop.plan === "pro_plus";
              const isExpiredPlan = isPaidPlan && Boolean(shop.planExpiresAt) && new Date(shop.planExpiresAt!).getTime() < Date.now();
              const normalizedPlan = shop.plan === "pro" || shop.plan === "pro_plus" ? shop.plan : "free";
              return <AdminShopRow key={shop.id} shop={{ id: shop.id, name: shop.name, slug: shop.slug, plan: normalizedPlan, planExpiresAt: shop.planExpiresAt ? Math.floor(new Date(shop.planExpiresAt).getTime() / 1000) : null, isPublished: shop.status === "ACTIVE", isSuspended: shop.status === "SUSPENDED", isDraft: shop.status === "DRAFT", isExpiredPlan, createdAt: Math.floor(new Date(shop.createdAt).getTime() / 1000), sellerName: shop.owner?.name || "Vendeur", sellerPhone: shop.owner?.phone || shop.whatsapp || "—", productCount: shop._count.products, orderCount: shop._count.orders }} />;
            })}
          </tbody></table></div>
          <AdminPagination page={overview.shops.page} totalPages={overview.shops.totalPages} total={overview.shops.total} pageSize={overview.shops.pageSize} noun="boutiques" hrefForPage={makeHref} />
        </section>
        <p className="mt-4 text-xs leading-5 text-muted/65">Les accès attribués depuis cette page durent 30 jours pour Pro et Pro+. Ils sont gérés manuellement et ne correspondent pas à une confirmation de paiement.</p>
      </>
    );
  } catch (error) {
    return <AdminError message={error instanceof Error ? error.message : "Impossible de charger les abonnements."} />;
  }
}

function SubscriptionStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className={`${adminPanelClass()} flex items-center gap-3 p-3 sm:p-4`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5">{icon}</span><div><p className="font-bricolage text-xl font-black leading-none">{value}</p><p className="mt-1 text-[10px] font-semibold text-muted">{label}</p></div></div>;
}

function PlanTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={`rounded-full border px-3 py-2 text-xs font-black ${active ? "border-sun bg-sun text-ink" : "border-ink/15 text-muted hover:bg-ink/5"}`}>{children}</Link>;
}
