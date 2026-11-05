import { Search, Store } from "lucide-react";
import { getSessionToken } from "@/lib/auth";
import { getAdminShops } from "@/services/admin.service";
import { AdminError, AdminPageTitle, AdminPagination, adminPanelClass } from "../AdminUI";
import AdminFilterForm from "../AdminFilterForm";
import AdminShopRow from "../AdminShopRow";

export const metadata = { title: "Boutiques · Administration Jaaymaa" };
type SearchParams = Promise<{ q?: string; status?: string; plan?: string; page?: string }>;

export default async function AdminShopsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = await getSessionToken();
  if (!token) return <AdminError message="Votre session a expiré. Reconnectez-vous." />;
  const query = params.q?.trim() || "";
  const status = params.status || "";
  const plan = params.plan || "";
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  try {
    const data = await getAdminShops({ q: query, status, plan, page });
    const makeHref = (nextPage: number) => {
      const search = new URLSearchParams();
      if (query) search.set("q", query);
      if (status) search.set("status", status);
      if (plan) search.set("plan", plan);
      search.set("page", String(nextPage));
      return `/admin/boutiques?${search}`;
    };
    return (
      <>
        <AdminPageTitle eyebrow="Gestion du catalogue de vendeurs" title="Boutiques" description="Retrouvez toutes les boutiques, y compris les brouillons et les boutiques suspendues. Gérez leur visibilité et leur accès Pro." action={<span className="rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs font-bold text-muted"><Store size={14} className="mr-1.5 inline text-[#9A6500]" />{data.total} résultat{data.total !== 1 ? "s" : ""}</span>} />

        <AdminFilterForm action="/admin/boutiques" className={`${adminPanelClass()} grid gap-3 p-4 sm:grid-cols-[minmax(230px,1fr)_170px_170px_auto] sm:items-center sm:p-5 md:grid-cols-2 xl:grid-cols-[minmax(230px,1fr)_170px_170px_auto] xl:items-center`}>
          <label className="relative block"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input type="search" name="q" defaultValue={query} placeholder="Boutique, vendeur ou téléphone…" className="w-full rounded-xl border border-ink/15 bg-papier py-3 pl-10 pr-3 text-sm font-semibold text-ink outline-none focus:border-sun" /></label>
          <select name="status" defaultValue={status} aria-label="Filtrer par statut" className="rounded-xl border border-ink/10 bg-[#FFFBF2] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-sun"><option value="">Tous les statuts</option><option value="ACTIVE">En ligne</option><option value="DRAFT">Brouillon</option><option value="SUSPENDED">Suspendue</option></select>
          <select name="plan" defaultValue={plan} aria-label="Filtrer par abonnement" className="rounded-xl border border-ink/10 bg-[#FFFBF2] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-sun"><option value="">Tous les plans</option><option value="pro">Pro actif</option><option value="pro_plus">Pro+ actif</option><option value="expired">Abonnement expiré</option><option value="free">Gratuit</option></select>
          <button className="rounded-xl border-2 border-ink bg-sun px-5 py-3 text-sm font-black text-ink shadow-[3px_3px_0_#000]">Rechercher</button>
        </AdminFilterForm>

        <section className={`${adminPanelClass()} mt-5 overflow-hidden`}>
          <div className="overflow-x-auto"><table className="w-full min-w-[870px] border-collapse text-left md:block md:min-w-0 2xl:table 2xl:min-w-[870px]">
            <thead className="md:hidden 2xl:table-header-group"><tr className="bg-[#F0EDE8] text-[10px] font-black uppercase tracking-[0.13em] text-muted"><th className="px-4 py-3.5 sm:px-5">Boutique</th><th className="px-4 py-3.5">Vendeur</th><th className="px-4 py-3.5">Activité</th><th className="px-4 py-3.5">Statut & plan</th><th className="px-4 py-3.5 text-right">Gestion</th></tr></thead>
            <tbody className="md:grid md:grid-cols-2 md:gap-3 md:p-3 2xl:table-row-group 2xl:gap-0 2xl:p-0">
              {data.items.length === 0 ? <tr className="md:col-span-2 md:block 2xl:table-row"><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted md:block 2xl:table-cell">Aucune boutique ne correspond à ces filtres.</td></tr> : data.items.map((shop) => {
                const isPaidPlan = shop.plan === "pro" || shop.plan === "pro_plus";
                const isExpiredPlan = isPaidPlan && Boolean(shop.planExpiresAt) && new Date(shop.planExpiresAt!).getTime() < Date.now();
                const normalizedPlan = shop.plan === "pro" || shop.plan === "pro_plus" ? shop.plan : "free";
                return <AdminShopRow key={shop.id} shop={{ id: shop.id, name: shop.name, slug: shop.slug, plan: normalizedPlan, planExpiresAt: shop.planExpiresAt ? Math.floor(new Date(shop.planExpiresAt).getTime() / 1000) : null, isPublished: shop.status === "ACTIVE", isSuspended: shop.status === "SUSPENDED", isDraft: shop.status === "DRAFT", isExpiredPlan, createdAt: Math.floor(new Date(shop.createdAt).getTime() / 1000), sellerName: shop.owner?.name || "Vendeur", sellerPhone: shop.owner?.phone || shop.whatsapp || "—", productCount: shop._count.products, orderCount: shop._count.orders }} />;
              })}
            </tbody>
          </table></div>
          <AdminPagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} noun="boutiques" hrefForPage={makeHref} />
        </section>
        <p className="mt-4 text-xs leading-5 text-muted/65">La suspension rend une boutique inaccessible aux clients. Les commandes et le catalogue restent conservés.</p>
      </>
    );
  } catch (error) {
    return <AdminError message={error instanceof Error ? error.message : "Impossible de charger les boutiques."} />;
  }
}
