import { getCurrentSellerContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatFcfa } from "@/lib/money";
import { getEffectivePlan, getProductLimit } from "@/lib/plans";
import { getImageUrl } from "@/lib/images";
import { listProductsByShop } from "@/services/product.service";
import { Package, Plus, Lightbulb } from "lucide-react";
import DeleteProductButton from "./DeleteProductButton";

export const metadata = {
  title: "Mes Produits - Espace Vendeur",
};

export default async function ProduitsPage() {
  const sellerContext = await getCurrentSellerContext();
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

  const allShopProducts = await listProductsByShop(shop.id);
  const shopProducts = allShopProducts.filter((product) => product.status !== "ARCHIVED");
  const archivedProducts = allShopProducts.filter((product) => product.status === "ARCHIVED");
  const imageUrls: Record<string, string> = {};
  for (const product of shopProducts) {
    const img = product.imageUrl ?? product.images?.[0]?.url;
    if (img) imageUrls[product.id] = getImageUrl(img) || img;
  }

  const activeCount = shopProducts.filter((p) => p.isActive).length;
  const effectivePlan = getEffectivePlan(shop.plan, shop.planExpiresAt);
  const limit = getProductLimit(effectivePlan);
  const isLimitReached = activeCount >= limit;

  return (
    <div className="mx-auto max-w-xl p-5 md:max-w-5xl md:px-8 xl:max-w-[1400px]">
      {/*  HEADER  */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: "#C3CCE6" }}>Ma boutique</p>
          <h1 className="font-bricolage font-black text-white leading-none" style={{ fontSize: "clamp(2rem, 8vw, 2.5rem)", letterSpacing: "-0.02em" }}>
            Produits
          </h1>
        </div>
        <Link
          href="/espace/produits/nouveau"
          prefetch={true}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-black border-[2.5px] border-ink transition-transform active:scale-95 shadow-[3px_3px_0_#0F1E3D]"
          style={{ backgroundColor: "#FFC83D", color: "#0F1E3D" }}
        >
          <Plus size={16} strokeWidth={3} />
          <span>Ajouter</span>
        </Link>
      </div>

      {/*  BARRE DE PROGRESSION  */}
      <div className="p-4 rounded-[16px] mb-6" style={{ backgroundColor: "#16264D" }}>
        <div className="flex items-center justify-between mb-3 text-[13px] font-semibold">
          <span className="text-white">
            {activeCount} produits sur {limit}, {effectivePlan === "pro_plus" ? "plan Pro+" : effectivePlan === "pro" ? "plan Pro" : "plan gratuit"}
          </span>
          {effectivePlan === "free" && (
            <Link href="/espace/abonnement" prefetch={true} className="font-black" style={{ color: "#FFC83D" }}>
              Passer Pro
            </Link>
          )}
          {effectivePlan === "pro" && isLimitReached && (
            <Link href="/espace/abonnement" prefetch={true} className="font-black" style={{ color: "#FFC83D" }}>
              Passer Pro+
            </Link>
          )}
          {effectivePlan === "pro_plus" && isLimitReached && (
            <span className="font-black text-[#F6C3D2]">Limite Pro+ atteinte</span>
          )}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#2A3B66" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              backgroundColor: isLimitReached ? "#C8265A" : "#FFC83D",
              width: `${Math.min(100, (activeCount / limit) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/*  LISTE DES PRODUITS  */}
      {shopProducts.length === 0 ? (
        <div className="py-12 px-6 text-center rounded-3xl bg-[#0F1E3D]/80 border border-white/10 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          {/* Halo d'ambiance */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-sun/15 rounded-full blur-3xl pointer-events-none" />

          {/* Icône stylisée */}
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-sun/20 to-[#FFAA00]/10 border border-sun/30 flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Package size={36} className="text-[#FFC83D]" strokeWidth={2} />
          </div>

          <h3 className="font-bricolage font-black text-white text-xl mb-2">
            Votre catalogue est encore vide
          </h3>
          <p className="text-sm font-medium mb-6 max-w-sm mx-auto" style={{ color: "#C3CCE6" }}>
            Ajoutez vos premiers articles avec photos, prix et variantes pour commencer à vendre et partager votre lien.
          </p>

          <Link
            href="/espace/produits/nouveau"
            prefetch={true}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-black text-[#0F1E3D] bg-gradient-to-r from-[#FFC83D] to-[#FFAA00] shadow-[0_8px_24px_rgba(255,200,61,0.35)] active:scale-95 transition-transform"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Ajouter mon premier article</span>
          </Link>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs font-semibold text-white/60">
            <Lightbulb size={14} className="text-[#FFC83D] shrink-0" />
            <span>Astuce : Les boutiques avec au moins 3 photos par produit enregistrent 2x plus de commandes.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5 md:grid md:grid-cols-2 md:items-stretch md:gap-4 md:space-y-0 xl:grid-cols-3">
          {shopProducts.map((product) => {
            const hasImage = Boolean(imageUrls[product.id]);
            return (
              <div
                key={product.id}
                className="flex items-center p-3 rounded-[20px] border-[2.5px] border-ink transition-transform shadow-[3px_3px_0_#0F1E3D] hover:-translate-y-0.5"
                style={{ backgroundColor: "#FFFBF2" }}
              >
                <Link
                  href={`/espace/produits/${product.id}`}
                  prefetch={true}
                  className="flex items-center flex-1 min-w-0"
                >
                  {/* Miniature / Placeholder moderne */}
                  {hasImage ? (
                    <div className="w-14 h-14 rounded-2xl shrink-0 border-[2px] border-ink mr-3.5 overflow-hidden bg-white shadow-[2px_2px_0_#0F1E3D] flex items-center justify-center p-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrls[product.id]}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                  ) : (
                    (() => {
                      const palette = [
                        { bg: "#FFC83D", text: "#0F1E3D" },
                        { bg: "#F6C3D2", text: "#8C1C41" },
                        { bg: "#CFEFE6", text: "#075F4D" },
                        { bg: "#DCE5FF", text: "#263B70" },
                      ];
                      const colorIndex = Math.abs((product.name || "P").charCodeAt(0)) % palette.length;
                      const color = palette[colorIndex];
                      const initial = (product.name || "P").trim().charAt(0).toUpperCase();

                      return (
                        <div
                          className="w-14 h-14 rounded-2xl shrink-0 border-[2px] border-ink mr-3.5 overflow-hidden shadow-[2px_2px_0_#0F1E3D] flex flex-col items-center justify-center relative select-none"
                          style={{ backgroundColor: color.bg }}
                          title="Aucune photo pour cet article"
                        >
                          <span
                            className="font-bricolage font-black text-xl leading-none"
                            style={{ color: color.text }}
                          >
                            {initial}
                          </span>
                          <Package
                            className="w-3.5 h-3.5 absolute bottom-1 right-1 opacity-40"
                            style={{ color: color.text }}
                            strokeWidth={2.5}
                          />
                        </div>
                      );
                    })()
                  )}

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <p className="line-clamp-2 font-bold text-ink text-[15px] leading-snug">{product.name}</p>
                      {!hasImage && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded border border-ink/25 text-[#3F4B69] bg-[#0F1E3D]/5 shrink-0">
                          Sans photo
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <p className="whitespace-nowrap font-bricolage font-black text-[13px] sm:text-sm" style={{ color: "#C8265A" }}>
                        {formatFcfa(product.price)}
                      </p>
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full border border-ink/20"
                        style={{
                          backgroundColor: (product.stock ?? 0) > 0 ? "rgba(14,124,102,0.12)" : "rgba(200,38,90,0.12)",
                          color: (product.stock ?? 0) > 0 ? "#0E7C66" : "#C8265A",
                        }}
                      >
                        {(product.stock ?? 0) > 0 ? `${product.stock} en stock` : "Rupture"}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Actions: Pill Status + Bouton Supprimer */}
                <div className="shrink-0 pl-3 border-l-2 border-ink/10 flex items-center gap-2">
                  <Link
                    href={`/espace/produits/${product.id}`}
                    prefetch={true}
                    className="w-11 h-6 rounded-full flex items-center relative transition-colors"
                    style={{ backgroundColor: product.isActive ? "#0E7C66" : "#3A4A75" }}
                    title={product.isActive ? "Produit visible (cliquez pour modifier)" : "Brouillon / Masqué"}
                  >
                    <div
                      className="w-4 h-4 rounded-full bg-white absolute transition-all shadow-sm"
                      style={{ left: product.isActive ? "22px" : "4px" }}
                    />
                  </Link>

                  <DeleteProductButton id={product.id} name={product.name} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {archivedProducts.length > 0 && (
        <section className="mt-8">
          <div className="mb-3">
            <h2 className="font-bricolage font-black text-white text-lg">Produits archivés</h2>
            <p className="mt-1 text-xs font-medium" style={{ color: "#C3CCE6" }}>
              Retirés de la vitrine, ils restent associés aux commandes déjà passées.
            </p>
          </div>
          <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 xl:grid-cols-3">
            {archivedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/espace/produits/${product.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-white"
                style={{ backgroundColor: "#16264D" }}
              >
                <span className="min-w-0 truncate text-sm font-bold">{product.name}</span>
                <span className="shrink-0 text-xs font-bold" style={{ color: "#FFC83D" }}>
                  Voir / restaurer
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
