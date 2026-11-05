import Link from "next/link";
import { Search, Users } from "lucide-react";
import { getSessionToken } from "@/lib/auth";
import { getAdminAccounts } from "@/services/admin.service";
import { AdminError, AdminPageTitle, AdminPagination, adminPanelClass } from "../AdminUI";
import AdminFilterForm from "../AdminFilterForm";

export const metadata = { title: "Comptes vendeurs · Administration Jaaymaa" };
type SearchParams = Promise<{ q?: string; hasShop?: string; page?: string }>;

export default async function AdminAccountsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = await getSessionToken();
  if (!token) return <AdminError message="Votre session a expiré. Reconnectez-vous." />;
  const query = params.q?.trim() || "";
  const hasShop = params.hasShop || "";
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  try {
    const result = await getAdminAccounts({ q: query, hasShop, page });
    const hrefForPage = (nextPage: number) => {
      const search = new URLSearchParams();
      if (query) search.set("q", query);
      if (hasShop) search.set("hasShop", hasShop);
      search.set("page", String(nextPage));
      return `/admin/comptes?${search}`;
    };
    return (
      <>
        <AdminPageTitle eyebrow="Commerçants Jaaymaa" title="Comptes vendeurs" description="Recherchez les comptes, vérifiez leur activité et accédez rapidement à leur boutique. Les mots de passe et données d’authentification ne sont jamais affichés." action={<span className="rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs font-bold text-muted"><Users size={14} className="mr-1.5 inline text-[#9A6500]" />{result.total} compte{result.total !== 1 ? "s" : ""}</span>} />
        <AdminFilterForm action="/admin/comptes" className={`${adminPanelClass()} grid gap-3 p-4 sm:grid-cols-[minmax(240px,1fr)_190px_auto] sm:items-center sm:p-5 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_190px_auto] xl:items-center`}>
          <label className="relative block"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input type="search" name="q" defaultValue={query} placeholder="Nom ou numéro de téléphone…" className="w-full rounded-xl border border-ink/15 bg-papier py-3 pl-10 pr-3 text-sm font-semibold text-ink outline-none focus:border-sun" /></label>
          <select name="hasShop" defaultValue={hasShop} aria-label="Filtrer par boutique" className="rounded-xl border border-ink/10 bg-[#FFFBF2] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-sun"><option value="">Tous les comptes</option><option value="true">Avec boutique</option><option value="false">Sans boutique</option></select>
          <button className="rounded-xl border-2 border-ink bg-sun px-5 py-3 text-sm font-black text-ink shadow-[3px_3px_0_#000]">Rechercher</button>
        </AdminFilterForm>

        <section className={`${adminPanelClass()} mt-5 overflow-hidden`}>
          <div className="overflow-x-auto"><table className="w-full min-w-[780px] border-collapse text-left md:block md:min-w-0 2xl:table 2xl:min-w-[780px]">
            <thead className="md:hidden 2xl:table-header-group"><tr className="bg-[#F0EDE8] text-[10px] font-black uppercase tracking-[0.13em] text-muted"><th className="px-4 py-3.5 sm:px-5">Vendeur</th><th className="px-4 py-3.5">Inscription</th><th className="px-4 py-3.5">Boutiques</th><th className="px-4 py-3.5">Commandes</th><th className="px-4 py-3.5">Accès</th></tr></thead>
            <tbody className="md:grid md:grid-cols-2 md:gap-3 md:p-3 2xl:table-row-group 2xl:gap-0 2xl:p-0">{result.items.length === 0 ? <tr className="md:col-span-2 md:block 2xl:table-row"><td colSpan={5} className="px-5 py-12 text-center text-sm text-muted md:block 2xl:table-cell">Aucun compte ne correspond à cette recherche.</td></tr> : result.items.map((user) => (
              <tr key={user.id} className="border-t border-ink/10 transition-colors hover:bg-ink/[0.03] md:grid md:grid-cols-2 md:rounded-[20px] md:border md:border-ink/10 md:bg-white md:p-2 md:shadow-[2px_2px_0_#0F1E3D] 2xl:table-row 2xl:rounded-none 2xl:border-0 2xl:border-t 2xl:bg-transparent 2xl:p-0 2xl:shadow-none">
                <td className="px-4 py-4 sm:px-5 md:block md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4"><span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Vendeur</span><p className="font-bold text-ink">{user.name || "Vendeur"}</p><a href={`tel:${user.phone}`} className="mt-1 block font-mono text-xs text-muted hover:text-[#9A6500]">{user.phone}</a></td>
                <td className="px-4 py-4 text-xs text-muted md:block md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4"><span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Inscription</span>{formatDate(user.createdAt)}</td>
                <td className="px-4 py-4 md:block md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4"><span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Boutiques</span><span className="font-bricolage text-lg font-black">{user.shopCount}</span></td>
                <td className="px-4 py-4 md:block md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4"><span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Commandes</span><span className="font-bricolage text-lg font-black">{user.orderCount}</span></td>
                <td className="px-4 py-4 md:col-span-2 md:block md:px-2 md:py-2 2xl:table-cell 2xl:px-4 2xl:py-4"><span className="mb-1 hidden text-[9px] font-black uppercase tracking-[0.12em] text-muted md:block 2xl:hidden">Accès</span><div className="flex flex-wrap gap-1.5">{user.shops.length ? user.shops.map((shop) => <Link key={shop.id} href={`/admin/boutiques?q=${encodeURIComponent(shop.slug)}`} className="rounded-full border border-ink/10 bg-ink/5 px-2.5 py-1 text-[10px] font-bold text-muted hover:border-sun/40 hover:text-ink">{shop.name}</Link>) : <span className="text-xs text-muted/60">Pas encore de boutique</span>}</div></td>
              </tr>
            ))}</tbody>
          </table></div>
          <AdminPagination page={result.page} totalPages={result.totalPages} total={result.total} pageSize={result.pageSize} noun="comptes" hrefForPage={hrefForPage} />
        </section>
      </>
    );
  } catch (error) {
    return <AdminError message={error instanceof Error ? error.message : "Impossible de charger les comptes vendeurs."} />;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Africa/Dakar" }).format(new Date(value));
}
