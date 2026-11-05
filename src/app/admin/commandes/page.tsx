import { ArrowUpRight, Search, ShoppingBag } from "lucide-react";
import { getSessionToken } from "@/lib/auth";
import { getAdminOrders } from "@/services/admin.service";
import { formatFcfa } from "@/lib/money";
import { AdminError, AdminPageTitle, AdminPagination, adminPanelClass } from "../AdminUI";
import AdminFilterForm from "../AdminFilterForm";

export const metadata = { title: "Commandes · Administration Jaaymaa" };
type SearchParams = Promise<{ q?: string; status?: string; payment?: string; page?: string }>;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = await getSessionToken();
  if (!token) return <AdminError message="Votre session a expiré. Reconnectez-vous." />;
  const query = params.q?.trim() || "";
  const status = params.status || "";
  const payment = params.payment || "";
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  try {
    const result = await getAdminOrders({ q: query, status, payment, page });
    const hrefForPage = (nextPage: number) => {
      const search = new URLSearchParams();
      if (query) search.set("q", query);
      if (status) search.set("status", status);
      if (payment) search.set("payment", payment);
      search.set("page", String(nextPage));
      return `/admin/commandes?${search}`;
    };
    return (
      <>
        <AdminPageTitle eyebrow="Suivi des ventes" title="Commandes" description="Consultez les commandes de toutes les boutiques et repérez rapidement les paiements en attente ou les commandes à traiter." action={<span className="rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs font-bold text-muted"><ShoppingBag size={14} className="mr-1.5 inline text-[#9A6500]" />{result.total} commande{result.total !== 1 ? "s" : ""}</span>} />

        <AdminFilterForm action="/admin/commandes" className={`${adminPanelClass()} grid gap-3 p-4 sm:grid-cols-[minmax(220px,1fr)_190px_170px_auto] sm:items-center sm:p-5 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_190px_170px_auto] xl:items-center`}>
          <label className="relative block"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input type="search" name="q" defaultValue={query} placeholder="Référence, client, téléphone, boutique…" className="w-full rounded-xl border border-ink/15 bg-papier py-3 pl-10 pr-3 text-sm font-semibold text-ink outline-none focus:border-sun" /></label>
          <select name="status" defaultValue={status} aria-label="Statut de commande" className="rounded-xl border border-ink/10 bg-[#FFFBF2] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-sun"><option value="">Tous les statuts</option><option value="NEW">Nouvelle</option><option value="CONFIRMED">Confirmée</option><option value="PAID">Payée</option><option value="PREPARING">En préparation</option><option value="OUT_FOR_DELIVERY">En livraison</option><option value="DELIVERED">Livrée</option><option value="CANCELLED">Annulée</option></select>
          <select name="payment" defaultValue={payment} aria-label="Statut de paiement" className="rounded-xl border border-ink/10 bg-[#FFFBF2] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-sun"><option value="">Tous les paiements</option><option value="paid">Payée</option><option value="pending">En attente</option></select>
          <button className="rounded-xl border-2 border-ink bg-sun px-5 py-3 text-sm font-black text-ink shadow-[3px_3px_0_#000]">Filtrer</button>
        </AdminFilterForm>

        <section className={`${adminPanelClass()} mt-5 overflow-hidden`}>
          <div className="overflow-x-auto"><table className="w-full min-w-[830px] border-collapse text-left md:block md:min-w-0 2xl:table 2xl:min-w-[830px]">
            <thead className="md:hidden 2xl:table-header-group"><tr className="bg-[#F0EDE8] text-[10px] font-black uppercase tracking-[0.13em] text-muted"><th className="px-4 py-3.5 sm:px-5">Référence</th><th className="px-4 py-3.5">Client</th><th className="px-4 py-3.5">Boutique</th><th className="px-4 py-3.5">Montant & paiement</th><th className="px-4 py-3.5">Statut</th></tr></thead>
            <tbody className="md:grid md:grid-cols-2 md:gap-3 md:p-3 2xl:table-row-group 2xl:gap-0 2xl:p-0">{result.items.length === 0 ? <tr className="md:col-span-2 md:block 2xl:table-row"><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted md:block 2xl:table-cell">Aucune commande ne correspond à ces filtres.</td></tr> : result.items.map((order) => (
              <tr key={order.id} className="border-t border-ink/10 text-sm transition-colors hover:bg-ink/[0.03] md:grid md:grid-cols-2 md:rounded-[20px] md:border md:border-ink/10 md:bg-white md:p-2 md:shadow-[2px_2px_0_#0F1E3D] 2xl:table-row 2xl:rounded-none 2xl:border-0 2xl:border-t 2xl:bg-transparent 2xl:p-0 2xl:shadow-none">
                <td className="px-4 py-4 sm:px-5 md:block md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4"><span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Référence</span><p className="font-mono text-xs font-black text-[#9A6500]">{order.reference}</p><p className="mt-1 text-[11px] text-muted">{formatDate(order.createdAt)}</p></td>
                <td className="px-4 py-4 md:block md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4"><span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Client</span><p className="font-bold text-ink">{order.customerName}</p><a href={`tel:${order.customerPhone}`} className="mt-1 block text-xs text-muted hover:text-[#9A6500]">{order.customerPhone}</a></td>
                <td className="px-4 py-4 md:block md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4"><span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Boutique</span><a href={`/${order.shop.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-ink hover:text-[#9A6500]">{order.shop.name}<ArrowUpRight size={12} /></a><p className="mt-1 text-[11px] text-muted">{order._count.items} article{order._count.items !== 1 ? "s" : ""}</p></td>
                <td className="px-4 py-4 md:block md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4"><span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Montant & paiement</span><p className="font-bricolage font-black text-ink">{formatFcfa(order.total)}</p><p className={`mt-1 text-[10px] font-black uppercase ${order.paymentStatus.toLowerCase() === "paid" ? "text-baobab" : "text-[#8A5A00]"}`}>{order.paymentStatus.toLowerCase() === "paid" ? "Payée" : "En attente"} · {paymentLabel(order.paymentMethod)}</p></td>
                <td className="px-4 py-4 md:col-span-2 md:block md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4"><span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Statut</span><span className="rounded-full border border-ink/15 bg-ink/5 px-2.5 py-1 text-[10px] font-black text-muted">{statusLabel(order.status)}</span></td>
              </tr>
            ))}</tbody>
          </table></div>
          <AdminPagination page={result.page} totalPages={result.totalPages} total={result.total} pageSize={result.pageSize} noun="commandes" hrefForPage={hrefForPage} />
        </section>
      </>
    );
  } catch (error) {
    return <AdminError message={error instanceof Error ? error.message : "Impossible de charger les commandes."} />;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Dakar" }).format(new Date(value));
}

function statusLabel(value: string) {
  const labels: Record<string, string> = { NEW: "Nouvelle", CONFIRMED: "Confirmée", PAID: "Payée", PREPARING: "En préparation", OUT_FOR_DELIVERY: "En livraison", DELIVERED: "Livrée", CANCELLED: "Annulée" };
  return labels[value] || value;
}

function paymentLabel(value: string) {
  const labels: Record<string, string> = { cash: "espèces", wave: "Wave", orange_money: "Orange Money", orange: "Orange Money" };
  return labels[value.toLowerCase()] || value;
}
