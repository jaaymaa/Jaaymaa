import { getCurrentSellerContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatFcfa } from "@/lib/money";
import { listOrdersByShop } from "@/services/order.service";
import type { Order } from "@/types/schema";
import OrderNotifications from "./OrderNotifications";

export const metadata = {
  title: "Commandes - Espace Vendeur",
};

const ORDERS_PER_PAGE = 20;

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [params, sellerContext] = await Promise.all([
    searchParams,
    getCurrentSellerContext(),
  ]);
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  if (!sellerContext) redirect("/connexion");
  const { shop } = sellerContext;

  if (!shop) {
    return (
      <div className="p-5 text-center mt-12">
        <p className="text-white text-lg font-bold mb-4">Boutique non configurée</p>
        <Link href="/espace/boutique" className="px-6 py-3 rounded-full font-bold border-[2.5px] border-ink bg-sun text-ink shadow-[4px_4px_0_#0F1E3D] inline-block">
          Configurer ma boutique
        </Link>
      </div>
    );
  }

  const ordersList: Order[] = await listOrdersByShop(shop.id, sellerContext.sellerId);
  const startOfTodayUnix = Math.floor(Date.now() / 86_400_000) * 86_400;
  const todayCount = ordersList.filter((o) => {
    const u = Math.floor(new Date(o.createdAt).getTime() / 1000);
    return u >= startOfTodayUnix;
  }).length;

  const offset = (currentPage - 1) * ORDERS_PER_PAGE;
  const pageOrders = ordersList.slice(offset, offset + ORDERS_PER_PAGE);
  const hasNextPage = ordersList.length > offset + ORDERS_PER_PAGE;

  const ordersWithItems = pageOrders.map((order) => {
    const itemsSummary = (order.items ?? [])
      .map((i) => {
        const base = i.name || i.product?.name;
        return i.options ? `${base} (${i.options})` : base;
      })
      .filter(Boolean)
      .join(", ");
    return { ...order, itemsSummary };
  });

  return (
    <div className="mx-auto max-w-xl p-5 md:max-w-5xl md:px-8 xl:max-w-[1400px]">
      {/*  HEADER  */}
      <div className="mb-5">
        <p className="text-sm font-medium mb-1" style={{ color: "#C3CCE6" }}>
          {todayCount > 0
            ? `Aujourd'hui, ${todayCount} ${todayCount === 1 ? "commande" : "commandes"}`
            : "Aucune commande aujourd'hui"}
        </p>
        <h1 className="font-bricolage font-black text-white leading-none" style={{ fontSize: "clamp(2rem, 8vw, 2.5rem)", letterSpacing: "-0.02em" }}>
          Commandes
        </h1>
      </div>

      <OrderNotifications sellerId={sellerContext.sellerId} hideWhenEnabled />

      {/*  FILTRES (chips)  */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        <div className="px-5 py-2 rounded-full font-bold text-[13px] border-[2px] border-sun shrink-0" style={{ backgroundColor: "#FFC83D", color: "#0F1E3D" }}>
          Toutes
        </div>
        <div className="px-5 py-2 rounded-full font-bold text-[13px] border-[2px] border-[#3A4A75] shrink-0" style={{ color: "#fff" }}>
          Nouvelles
        </div>
        <div className="px-5 py-2 rounded-full font-bold text-[13px] border-[2px] border-[#3A4A75] shrink-0" style={{ color: "#fff" }}>
          Payées
        </div>
      </div>

      {/*  LISTE  */}
      {ordersWithItems.length === 0 ? (
        <div className="py-12 px-6 text-center rounded-3xl bg-[#0F1E3D]/80 border border-white/10 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] mt-4">
          <div className="w-16 h-16 rounded-2xl bg-sun/20 border border-sun/30 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFC83D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" />
            </svg>
          </div>
          <h3 className="font-bricolage font-black text-white text-lg mb-1.5">
            Aucune commande pour le moment
          </h3>
          <p className="text-xs font-medium text-[#C3CCE6] max-w-xs mx-auto mb-5">
            Partage le lien de ta boutique pour que tes clients puissent passer leurs commandes en direct.
          </p>
          <Link
            href={`/${shop.slug}?from=seller`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-black border-[2px] border-ink bg-sun text-ink shadow-[3px_3px_0_#0F1E3D] active:scale-95 transition-transform"
          >
            <span>Voir ma boutique</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4 md:grid md:grid-cols-2 md:items-stretch md:gap-5 md:space-y-0 xl:grid-cols-3">
          {ordersWithItems.map((order) => {
            const st = order.status?.toLowerCase();
            const isNew = st === "new";
            const isDelivered = st === "delivered";
            const isPreparing = st === "preparing";

            // On extrait les 2 initiales
            const initials = order.customerName.substring(0, 2).toUpperCase();
            // On fait un résumé "Boubou brodé, sac"
            const desc = order.itemsSummary.substring(0, 30);

            return (
              <div key={order.id} className="relative">
                {/* Dents haut */}
                <svg viewBox="0 0 344 18" preserveAspectRatio="none" style={{ width: "100%", height: 18, display: "block" }}>
                  <path d="M0 18H344V0L334.6 9L325.1 0L315.7 9L306.3 0L296.9 9L287.4 0L278.0 9L268.6 0L259.1 9L249.7 0L240.3 9L230.9 0L221.4 9L212.0 0L202.6 9L193.1 0L183.7 9L174.3 0L164.9 9L155.4 0L146.0 9L136.6 0L127.1 9L117.7 0L108.3 9L98.9 0L89.4 9L80.0 0L70.6 9L61.0 0L51.8 9L42.5 0L33.2 9L23.4 0L14.0 9L4.6 0L0 9Z" fill="#FFFBF2" stroke="#0F1E3D" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </svg>

                {/* Corps */}
                <div className="px-5 py-4 flex items-start sm:items-center gap-3 relative" style={{ backgroundColor: "#FFFBF2" }}>
                  {/* Badge Rotated en haut à droite */}
                  {isNew && (
                    <div className="absolute right-4 top-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded border-[2px]" style={{ borderColor: "#C8265A", color: "#C8265A", transform: "rotate(-5deg)", display: "inline-block" }}>
                        NOUVELLE
                      </span>
                    </div>
                  )}
                  {isDelivered && (
                    <div className="absolute right-4 top-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded border-[2px]" style={{ borderColor: "#3F4B69", color: "#3F4B69", transform: "rotate(-5deg)", display: "inline-block" }}>
                        LIVRÉE
                      </span>
                    </div>
                  )}
                  {isPreparing && (
                    <div className="absolute right-4 top-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded border-[2px]" style={{ borderColor: "#0E7C66", color: "#0E7C66", transform: "rotate(-5deg)", display: "inline-block" }}>
                        EN PRÉP.
                      </span>
                    </div>
                  )}

                  {/* Avatar avec palette harmonieuse */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-[2px] border-ink shadow-sm"
                    style={{
                      backgroundColor:
                        ["#FFC83D", "#F6C3D2", "#CFEFE6", "#DCE5FF"][
                          Math.abs((order.customerName || "CL").charCodeAt(0)) % 4
                        ],
                    }}
                  >
                    <span className="font-bricolage font-black text-ink text-sm">{initials}</span>
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0 pr-16 mt-3">
                    <p className="font-bold text-ink text-[15px] truncate">{order.customerName}</p>
                    <p className="text-xs truncate" style={{ color: "#3F4B69" }}>{desc || "..."}</p>
                    <p className="mt-2 whitespace-nowrap font-bricolage font-black text-ink text-xs leading-tight sm:hidden">{formatFcfa(order.total)}</p>
                  </div>

                  {/* Prix (positionné absolu ou juste bas droite) */}
                  <div className="absolute right-5 bottom-4 hidden sm:block">
                    <p className="font-bricolage font-black text-ink text-lg">{formatFcfa(order.total)}</p>
                  </div>
                </div>

                {/* Dents bas */}
                <svg viewBox="0 0 344 18" preserveAspectRatio="none" style={{ width: "100%", height: 18, display: "block" }}>
                  <path d="M0 0H344V18L334.6 9L325.1 18L315.7 9L306.3 18L296.9 9L287.4 18L278.0 9L268.6 18L259.1 9L249.7 18L240.3 9L230.9 18L221.4 9L212.0 18L202.6 9L193.1 18L183.7 9L174.3 18L164.9 9L155.4 18L146.0 9L136.6 18L127.1 9L117.7 18L108.3 9L98.9 18L89.4 9L80.0 18L70.6 9L61.1 18L51.7 9L42.3 18L32.9 9L23.4 18L14.0 9L4.6 18L0 9Z" fill="#FFFBF2" stroke="#0F1E3D" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </svg>

                {/* Lien par-dessus (on enveloppe pas pour ne pas casser le SVG flex, on utilise un pseudo before) */}
                <Link href={`/espace/commandes/${order.id}`} prefetch={true} className="absolute inset-0 z-10 block" />
              </div>
            );
          })}
        </div>
      )}
      {(currentPage > 1 || hasNextPage) && (
        <nav aria-label="Pages de commandes" className="flex items-center justify-center gap-3 mt-8">
          {currentPage > 1 && (
            <Link
              href={`/espace/commandes?page=${currentPage - 1}`}
              prefetch={true}
              className="px-4 py-2 rounded-full border-[2px] border-ink text-sm font-bold"
              style={{ backgroundColor: "#FFC83D", color: "#0F1E3D" }}
            >
              Précédent
            </Link>
          )}
          <span className="text-sm font-semibold text-white">Page {currentPage}</span>
          {hasNextPage && (
            <Link
              href={`/espace/commandes?page=${currentPage + 1}`}
              prefetch={true}
              className="px-4 py-2 rounded-full border-[2px] border-ink text-sm font-bold"
              style={{ backgroundColor: "#FFC83D", color: "#0F1E3D" }}
            >
              Suivant
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
