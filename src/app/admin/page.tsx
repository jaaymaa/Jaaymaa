import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, BadgeCheck, Bell, Boxes, CircleDollarSign, CreditCard, ShoppingBag, Store, Users } from "lucide-react";
import { getSessionToken } from "@/lib/auth";
import { getAdminOverview } from "@/services/admin.service";
import { formatFcfa } from "@/lib/money";
import { AdminError, AdminPageTitle, adminPanelClass } from "./AdminUI";

export const metadata = { title: "Vue d’ensemble · Administration Jaaymaa" };

export default async function AdminDashboardPage() {
  const token = await getSessionToken();
  if (!token) return <AdminError message="Votre session a expiré. Reconnectez-vous." />;

  try {
    const { metrics, recentOrders } = await getAdminOverview();
    return (
      <>
        <AdminPageTitle eyebrow="Centre de pilotage" title="Vue d’ensemble" description="Les indicateurs clés et les dernières activités de la plateforme Jaaymaa." action={<span className="inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs font-semibold text-muted"><Activity size={15} className="text-baobab" /> Données en direct</span>} />

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Indicateurs globaux">
          <MetricCard label="Boutiques" value={metrics.totalShops} caption={`${metrics.activeShops} en ligne · ${metrics.suspendedShops} suspendue${metrics.suspendedShops !== 1 ? "s" : ""}`} icon={<Store size={18} />} tone="sun" />
          <MetricCard label="Comptes vendeurs" value={metrics.sellers} caption={`${metrics.activeProducts} produits actuellement en ligne`} icon={<Users size={18} />} tone="pink" />
          <MetricCard label="Commandes" value={metrics.totalOrders} caption={`${metrics.newOrders} nouvelles · ${metrics.todayOrders} aujourd’hui`} icon={<ShoppingBag size={18} />} tone="mint" />
          <MetricCard label="Ventes encaissées" value={formatFcfa(metrics.revenue)} caption={`${formatFcfa(metrics.revenueToday)} aujourd’hui · ${metrics.paidOrders} commandes payées`} icon={<CircleDollarSign size={18} />} tone="blue" />
        </section>

        <section className={`${adminPanelClass()} mt-5 grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 xl:grid-cols-6 sm:p-5`} aria-label="État de la plateforme">
          <QuickStat label="Boutiques actives" value={metrics.activeShops} icon={<BadgeCheck size={17} className="text-baobab" />} />
          <QuickStat label="Brouillons" value={metrics.draftShops} icon={<Boxes size={17} className="text-muted" />} />
          <QuickStat label="Pro actif" value={metrics.proShops} icon={<CreditCard size={17} className="text-[#9A6500]" />} />
          <QuickStat label="Pro+ actif" value={metrics.proPlusShops} icon={<BadgeCheck size={17} className="text-[#9A6500]" />} />
          <QuickStat label="Pro expiré" value={metrics.expiredProShops} icon={<AlertTriangle size={17} className="text-[#8A5A00]" />} />
          <QuickStat label="Pro+ expiré" value={metrics.expiredProPlusShops} icon={<AlertTriangle size={17} className="text-[#8A5A00]" />} />
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <section className={`${adminPanelClass()} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-4 sm:px-5">
              <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9A6500]">Activité récente</p><h2 className="mt-1 font-bricolage text-lg font-black">Nouvelles commandes</h2></div>
              <Link href="/admin/commandes?status=NEW" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink">Tout voir <ArrowRight size={14} /></Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted">Aucune commande pour le moment.</div>
            ) : (
              <div className="divide-y divide-white/10">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sun/25 bg-sun/10 text-[#9A6500]"><ShoppingBag size={17} /></span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{order.customerName}</p><p className="mt-0.5 truncate text-[11px] text-muted">{order.shop.name} · {order.reference}</p></div>
                    <p className="shrink-0 font-bricolage text-sm font-black text-[#9A6500]">{formatFcfa(order.total)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={`${adminPanelClass()} p-4 sm:p-5`}>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9A6500]">Accès rapide</p>
            <h2 className="mt-1 font-bricolage text-lg font-black">Gestion de la plateforme</h2>
            <div className="mt-4 grid gap-2">
              <QuickLink href="/admin/boutiques" title="Gérer les boutiques" description="Publication, suspension et catalogue" icon={<Store size={17} />} />
              <QuickLink href="/admin/abonnements" title="Abonnements Pro et Pro+" description={`${metrics.proShops + metrics.proPlusShops} actifs · ${metrics.expiredProShops + metrics.expiredProPlusShops} expirés`} icon={<CreditCard size={17} />} />
              <QuickLink href="/admin/notifications" title="Envoyer une notification" description="Informer les vendeurs abonnés au push" icon={<Bell size={17} />} />
            </div>
          </section>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted/60">Les ventes encaissées totalisent les commandes marquées comme payées.</p>
      </>
    );
  } catch (error) {
    return <AdminError message={error instanceof Error ? error.message : "Impossible de charger les indicateurs."} />;
  }
}

function MetricCard({ label, value, caption, icon, tone }: { label: string; value: string | number; caption: string; icon: React.ReactNode; tone: "sun" | "pink" | "mint" | "blue" }) {
  const toneClasses = { sun: "bg-sun", pink: "bg-[#F6C3D2]", mint: "bg-[#CFEFE6]", blue: "bg-[#DCE5FF]" };
  return <article className="flex min-h-[145px] flex-col justify-between rounded-[20px] border-2 border-ink bg-papier p-4 text-ink shadow-[4px_4px_0_#0F1E3D] sm:p-5"><div className="flex items-start justify-between gap-2"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted">{label}</p><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink ${toneClasses[tone]}`}>{icon}</span></div><p className="mt-3 break-words font-bricolage text-2xl font-black leading-none tracking-tight sm:text-3xl">{value}</p><p className="mt-2 text-[10px] font-semibold leading-4 text-muted sm:text-[11px]">{caption}</p></article>;
}

function QuickStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/[0.06]">{icon}</span><div><p className="font-bricolage text-lg font-black leading-none">{value}</p><p className="mt-1 text-[10px] font-semibold text-muted">{label}</p></div></div>;
}

function QuickLink({ href, title, description, icon }: { href: string; title: string; description: string; icon: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-ink/[0.03] p-3 transition-colors hover:border-sun/35 hover:bg-ink/[0.06]"><span className="text-[#9A6500]">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{title}</span><span className="mt-0.5 block truncate text-[11px] text-muted">{description}</span></span><ArrowRight size={14} className="text-muted" /></Link>;
}
