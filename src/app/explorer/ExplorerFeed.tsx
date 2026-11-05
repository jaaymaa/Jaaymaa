"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Home, Compass, Store } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { getImageUrl } from "@/lib/images";
import ProductImageFrame, { WAX_PATTERNS } from "@/components/ProductImageFrame";
import PriceDisplay from "@/components/PriceDisplay";
import FormattedDescription from "@/components/FormattedDescription";
import ShopVerificationBadge from "@/components/ShopVerificationBadge";
import type { Product, Shop } from "@/types/schema";
import { getEffectivePlan } from "@/lib/plans";

export interface ExploreItem {
  product: Product;
  shop: Shop;
  imageUrl: string | null;
}

const CATEGORIES = ["Tous", "Mode", "Beauté", "Alimentation", "Maison", "High-Tech", "Artisanat"];


function ExploreProductSheet({
  item,
  onClose,
  onOpenShop,
}: {
  item: ExploreItem;
  onClose: () => void;
  onOpenShop: () => void;
}) {
  const { product, shop, imageUrl } = item;
  const effectivePlan = getEffectivePlan(shop.plan, shop.planExpiresAt);
  const dragStartYRef = useRef<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current !== null && event.clientY - dragStartYRef.current > 72) onClose();
    dragStartYRef.current = null;
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0F1E3D]/65 backdrop-blur-[3px] sm:items-center sm:p-5"
      onClick={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="explore-product-title"
        className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[30px] border-[2.5px] border-ink bg-[#FFFBF2] pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-12px_48px_rgba(15,30,61,0.25)] animate-slide-up sm:rounded-[30px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex justify-center pt-3 sm:hidden"
          onPointerDown={handleDragStart}
          onPointerUp={handleDragEnd}
          onPointerCancel={() => { dragStartYRef.current = null; }}
          style={{ touchAction: "none" }}
          aria-hidden="true"
        >
          <div className="h-1.5 w-12 rounded-full bg-[#D8DCE8]" />
        </div>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/10 bg-[#FFFBF2]/95 px-5 py-3 backdrop-blur">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-[#3F4B69]">Fiche produit</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fiche produit"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-white text-2xl font-medium leading-none text-ink active:scale-90"
          >×</button>
        </div>
        <div className="p-4 sm:p-5">
          <div className="overflow-hidden rounded-[22px] border-2 border-ink bg-white p-2 shadow-[3px_3px_0_#0F1E3D]">
            <ProductImageFrame imageUrl={imageUrl} alt={product.name} wax={WAX_PATTERNS[0]} height={300} loading="eager" />
          </div>
          <div className="px-1 pb-2 pt-5">
            <div className="mb-2 flex items-start justify-between gap-3">
              <h2 id="explore-product-title" className="font-bricolage text-2xl font-black leading-tight text-ink">{product.name}</h2>
              {shop.category && <span className="shrink-0 rounded-full border border-ink/20 bg-[#FFC83D]/50 px-3 py-1 text-[10px] font-black text-ink">{shop.category}</span>}
            </div>
            <PriceDisplay amount={product.price} className="text-[30px] leading-tight text-[#C8265A]" />
            {product.description && (
              <section className="mt-5 border-t border-ink/10 pt-4" aria-label="Description du produit">
                <div className="mb-2.5 flex items-center gap-2">
                  <span aria-hidden="true" className="h-4 w-1 rounded-full bg-[#C8265A]" />
                  <h3 className="font-bricolage text-[13px] font-black tracking-[-0.01em] text-ink">À propos de cet article</h3>
                </div>
                <FormattedDescription text={product.description} className="space-y-2 text-[14px] leading-[1.8] text-[#46536F]" />
              </section>
            )}
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-ink/15 bg-white p-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-visible rounded-full border border-ink/20 bg-[#FFC83D]/35 font-bricolage font-black text-ink">
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                  {shop.logoKey ? <Image src={getImageUrl(shop.logoKey)!} alt="" width={44} height={44} className="h-full w-full bg-white object-contain" unoptimized /> : shop.name.slice(0, 1).toUpperCase()}
                </div>
                <ShopVerificationBadge plan={effectivePlan} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#6A748B]">Vendu par</p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-bricolage font-black text-ink">{shop.name}</p>
                </div>
                {(shop.area || shop.quartier) && <p className="truncate text-xs text-[#3F4B69]">{shop.area || shop.quartier}</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 border-t border-ink/10 bg-[#FFFBF2]/95 px-4 py-3 backdrop-blur sm:rounded-b-[28px]">
          <button
            type="button"
            disabled={isNavigating}
            onClick={() => {
              setIsNavigating(true);
              onOpenShop();
            }}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-[2.5px] border-ink px-5 text-sm font-black text-[#FFC83D] shadow-[3px_3px_0_#0F1E3D] transition-transform active:scale-[0.98] disabled:opacity-80"
            style={{ backgroundColor: "#0F1E3D" }}
          >
            {isNavigating ? (
              <>
                <JaaymaLoader size={36} />
                <span>Ouverture de la boutique...</span>
              </>
            ) : (
              <>
                <span>Ouvrir dans la boutique</span>
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function ExplorerFeed({
  initialProducts,
  initialCategory,
  initialQuery,
  initialPage,
  initialHasNextPage,
  initialShops,
  initialView,
}: {
  initialProducts: ExploreItem[];
  initialCategory: string;
  initialQuery: string;
  initialPage: number;
  initialHasNextPage: boolean;
  initialShops: Shop[];
  initialView: "products" | "shops";
}) {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState(initialCategory || "Tous");
  const [query, setQuery] = useState(initialQuery || "");
  const [view, setView] = useState<"products" | "shops">(initialView);
  const [products, setProducts] = useState<ExploreItem[]>(initialProducts);
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [page, setPage] = useState(initialPage);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ExploreItem | null>(null);

  const cacheRef = useRef<Map<string, { products: ExploreItem[]; shops: Shop[]; hasNextPage: boolean }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Précharger la page d'accueil et la connexion pour une navigation instantanée
    router.prefetch("/");
    router.prefetch("/connexion");
  }, [router]);

  useEffect(() => () => {
    abortControllerRef.current?.abort();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  }, []);

  useEffect(() => {
    const clearShopReturnMarker = () => sessionStorage.removeItem("jaayma:explorer-return");
    window.addEventListener("popstate", clearShopReturnMarker);
    return () => window.removeEventListener("popstate", clearShopReturnMarker);
  }, []);

  useEffect(() => {
    const key = `${initialView}__${initialCategory || "Tous"}__${initialQuery}__${initialPage}`;
    cacheRef.current.set(key, { products: initialProducts, shops: initialShops, hasNextPage: initialHasNextPage });
    setProducts(initialProducts);
    setShops(initialShops);
  }, [initialCategory, initialHasNextPage, initialPage, initialProducts, initialQuery, initialShops, initialView]);

  const loadResults = async (next: { view: "products" | "shops"; category: string; query: string; page: number }) => {
    const normalizedQuery = next.query.trim();
    const cacheKey = `${next.view}__${next.category}__${normalizedQuery}__${next.page}`;
    setView(next.view);
    setSelectedCat(next.category);
    setQuery(next.query);
    setPage(next.page);
    setLoadError(false);

    const urlParams = new URLSearchParams();
    if (normalizedQuery) urlParams.set("q", normalizedQuery);
    if (next.category !== "Tous") urlParams.set("cat", next.category);
    if (next.page > 1) urlParams.set("page", String(next.page));
    if (next.view === "shops") urlParams.set("view", "shops");
    const serializedParams = urlParams.toString();
    window.history.replaceState(null, "", `/explorer${serializedParams ? `?${serializedParams}` : ""}`);

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setProducts(cached.products);
      setShops(cached.shops);
      setHasNextPage(cached.hasNextPage);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    try {
      const fetchParams = new URLSearchParams();
      if (normalizedQuery) fetchParams.set("q", normalizedQuery);
      if (next.category !== "Tous") fetchParams.set("cat", next.category);
      fetchParams.set("page", String(next.page));
      const endpoint = next.view === "shops" ? "/api/explore/shops" : "/api/explore";
      const res = await fetch(`${endpoint}?${fetchParams.toString()}`, { signal: controller.signal });
      if (!res.ok) throw new Error("La recherche n'a pas pu aboutir.");
      const data = (await res.json()) as { items?: any[]; hasNextPage?: boolean };
      const nextProducts: ExploreItem[] = next.view === "products" ? data.items || [] : [];
      const nextShops: Shop[] = next.view === "shops" ? data.items || [] : [];
      const nextHasPage = Boolean(data.hasNextPage);
      cacheRef.current.set(cacheKey, { products: nextProducts, shops: nextShops, hasNextPage: nextHasPage });
      setProducts(nextProducts);
      setShops(nextShops);
      setHasNextPage(nextHasPage);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setLoadError(true);
    } finally {
      if (abortControllerRef.current === controller) setIsLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (view === "products" && !query.trim()) {
      if (category !== "Tous") {
        setProducts(products.filter(({ shop }) => shop.category?.toLocaleLowerCase() === category.toLocaleLowerCase()));
      }
    }
    loadResults({ view, category, query, page: 1 });
  };
  const handleViewChange = (nextView: "products" | "shops") => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    loadResults({ view: nextView, category: selectedCat, query, page: 1 });
  };
  const handlePageChange = (targetPage: number) =>
    loadResults({ view, category: selectedCat, query, page: targetPage });

  const openProduct = (item: ExploreItem) => {
    setSelectedProduct(item);
    void router.prefetch(`/${item.shop.slug}?product=${encodeURIComponent(item.product.id)}`);
  };

  return (
    <div className="min-h-screen pb-20 sm:pb-24 md:pb-12" style={{ backgroundColor: "#FFC83D" }}>
      {/*  HEADER  */}
      <div className="mx-auto flex max-w-2xl items-center justify-between px-5 pt-5 md:max-w-[1600px] md:px-8 md:pt-7">
        <Link
          href="/"
          prefetch={true}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[2px] border-ink bg-white font-black text-xs text-ink shadow-[2.5px_2.5px_0_#0F1E3D] active:scale-95 transition-transform"
          aria-label="Retour à l'accueil Jaaymaa"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>Accueil</span>
        </Link>

        {/* Logo central Jaaymaa */}
        <Link href="/" prefetch={true} className="flex items-center gap-2 active:scale-95 transition-transform" aria-label="Accueil Jaaymaa">
          <svg width="28" height="28" viewBox="0 0 120 120" fill="none">
            <path d="M38 4H82A34 34 0 0 1 116 38V82A34 34 0 0 1 82 116H10A6 6 0 0 1 4 110V38A34 34 0 0 1 38 4Z" fill="#0F1E3D" />
            <path d="M64 46V76C64 90 57 97 44 97" stroke="#FFC83D" strokeWidth="12" strokeLinecap="round" fill="none" />
            <circle cx="64" cy="28" r="7.5" fill="#C8265A" />
          </svg>
          <span className="font-bricolage font-black text-ink text-lg tracking-tight hidden sm:inline">Jaaymaa</span>
        </Link>

        {/* Bouton Créer / Vendre */}
        <Link
          href="/connexion"
          prefetch={true}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[2px] border-ink bg-[#0F1E3D] text-[#FFC83D] text-xs font-black shadow-[2.5px_2.5px_0_#0F1E3D] active:scale-95 transition-transform"
        >
          <Store size={14} />
          <span>Vendre</span>
        </Link>
      </div>

      {/*  HERO COMPACT & ÉPURÉ  */}
      <div className="mx-auto max-w-2xl px-5 pt-4 md:grid md:max-w-[1600px] md:grid-cols-[270px_minmax(0,1fr)] md:items-start md:gap-8 md:px-8 md:pt-8">
        <aside className="md:sticky md:top-6 md:rounded-[28px] md:border-[2.5px] md:border-ink md:bg-[#FFFBF2] md:p-5 md:shadow-[5px_5px_0_#0F1E3D]">
        <div className="mb-3">
          <h1 className="font-bricolage font-black text-2xl tracking-tight text-ink sm:text-3xl md:text-4xl">
            Explorer
          </h1>
          <p className="text-xs font-semibold text-[#0F1E3D]/70 mt-0.5">
            Trouve tes produits et boutiques préférés au Sénégal
          </p>
        </div>

        {/*  Barre de recherche  */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
            loadResults({ view, category: selectedCat, query, page: 1 });
          }}
          className="mb-3.5"
        >
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border-[2px] border-ink bg-white shadow-[3px_3px_0_#0F1E3D]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F1E3D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l5 5" />
            </svg>
            <input
              type="text"
              name="q"
              value={query}
              onChange={(e) => {
                const nextQuery = e.target.value;
                setQuery(nextQuery);
                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                searchDebounceRef.current = setTimeout(() => {
                  loadResults({ view, category: selectedCat, query: nextQuery, page: 1 });
                }, 400);
              }}
              placeholder={
                view === "shops"
                  ? "Boutique"
                  : "Produit"
              }
              aria-label={view === "shops" ? "Rechercher une boutique" : "Rechercher un produit"}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[#3F4B69]/50 placeholder:font-normal"
              style={{ color: "#0F1E3D" }}
            />
            <button
              type="submit"
              disabled={isLoading}
              aria-label="Rechercher"
              className="shrink-0 rounded-full border-2 border-ink px-3.5 py-1.5 text-xs font-black active:scale-95 transition-transform flex items-center gap-1.5 disabled:opacity-80"
              style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "1.5px 1.5px 0 #0F1E3D" }}
            >
              {isLoading && <JaaymaLoader variant="mini-ink" size={28} />}
              <span>Rechercher</span>
            </button>
          </div>
        </form>

        {/* Basculer entre les produits et les boutiques */}
        <div className="mb-3.5 grid grid-cols-2 gap-1.5 rounded-full border-[2px] border-ink bg-[#0F1E3D] p-1" role="tablist" aria-label="Type de résultats">
          {(["products", "shops"] as const).map((item) => {
            const active = view === item;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleViewChange(item)}
                className={`rounded-full py-1.5 text-xs sm:text-sm font-black transition-all active:scale-[0.98] ${
                  active ? "bg-[#FFC83D] text-[#0F1E3D] shadow-sm" : "bg-transparent text-[#FFFBF2]/80 hover:text-white"
                }`}
              >
                {item === "products" ? "Produits" : "Boutiques"}
              </button>
            );
          })}
        </div>

        {/*  Catégories épurées  */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1.5 mb-4">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCat === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full border-[2px] border-ink transition-all active:scale-95 cursor-pointer select-none ${
                  isSelected
                    ? "bg-[#0F1E3D] text-[#FFC83D] shadow-[2px_2px_0_#0F1E3D]"
                    : "bg-white/80 hover:bg-white text-ink"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
        </aside>

        {/* Résultats */}
        <section className="md:min-w-0">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bricolage font-black text-lg tracking-tight text-ink md:text-2xl xl:text-3xl">
            {view === "shops"
              ? query ? `Boutiques pour « ${query} »` : "Boutiques à découvrir"
              : selectedCat !== "Tous" ? selectedCat : query ? `Résultats pour « ${query} »` : "Produits à découvrir"}
          </h2>
          {isLoading && (
            <JaaymaLoader size={28} />
          )}
        </div>

        {loadError && (
          <div className="mb-4 rounded-2xl border-2 border-ink bg-white px-4 py-3 text-sm font-semibold text-ink" role="alert">
            La recherche n’a pas pu aboutir. Vérifie ta connexion et réessaie.
          </div>
        )}

        {isLoading && (view === "products" ? products.length === 0 : shops.length === 0) && (
          <div className="rounded-2xl border-[2.5px] border-ink bg-white px-5 py-8 text-center" style={{ boxShadow: "4px 4px 0 #0F1E3D" }} aria-live="polite">
            <JaaymaLoader size={48} className="mx-auto mb-3" />
            <p className="font-bricolage font-bold text-ink">{view === "shops" ? "Recherche des boutiques…" : "Recherche des produits…"}</p>
          </div>
        )}

        {/* Produits ou boutiques */}
        {view === "products" && products.length === 0 && !isLoading && !loadError ? (
          <div className="bg-white rounded-2xl border-[2.5px] border-ink p-10 text-center" style={{ boxShadow: "4px 4px 0 #0F1E3D" }}>
            <h3 className="font-bricolage font-bold text-ink text-lg mb-1">Aucun produit trouvé</h3>
            <p className="text-sm mb-5" style={{ color: "#3F4B69" }}>
              {selectedCat !== "Tous"
                ? `Aucun produit disponible dans la catégorie ${selectedCat}.`
                : "Essayez un autre mot-clé ou réinitialisez les filtres."}
            </p>
            <button
              type="button"
              onClick={() => handleCategoryClick("Tous")}
              className="text-sm font-bold px-5 py-2.5 rounded-full border-[2px] border-ink active:scale-95 transition-transform"
              style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "2px 2px 0 #0F1E3D" }}
            >
              Voir tout
            </button>
          </div>
        ) : view === "products" ? (
          <div className={`grid grid-cols-2 gap-3 transition-opacity duration-150 md:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 ${isLoading ? "opacity-60" : "opacity-100"}`}>
            {products.map(({ product, shop, imageUrl }, i) => (
              <button
                key={product.id}
                type="button"
                onClick={() => openProduct({ product, shop, imageUrl })}
                className="min-w-0 overflow-hidden rounded-2xl border-[2.5px] border-ink text-left active:scale-[0.98] transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: "#FFFBF2", boxShadow: "4px 4px 0 #0F1E3D" }}
              >
                <div className="p-2 pb-0">
                  <ProductImageFrame
                    imageUrl={imageUrl}
                    alt={product.name}
                    wax={WAX_PATTERNS[i % WAX_PATTERNS.length]}
                    height={148}
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                  />
                </div>
                <div className="px-3 pt-2.5 pb-3">
                  <p className="font-bold text-ink text-sm leading-snug line-clamp-2 min-h-10">{product.name}</p>
                  <PriceDisplay amount={product.price} className="mt-1 text-[25px] leading-tight text-ink" />
                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-ink/15 min-w-0">
                    <div className="relative h-7 w-7 shrink-0 overflow-visible rounded-full" style={{ backgroundColor: i % 3 === 0 ? "#FFC83D" : i % 3 === 1 ? "#F6C3D2" : "#CFEFE6", color: "#0F1E3D" }}>
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full border border-ink/30 font-bold text-[10px]">
                        {shop.logoKey ? (
                          <Image src={getImageUrl(shop.logoKey)!} alt="" width={28} height={28} className="h-full w-full bg-white object-contain" unoptimized />
                        ) : shop.name.substring(0, 1).toUpperCase()}
                      </div>
                      <ShopVerificationBadge plan={getEffectivePlan(shop.plan, shop.planExpiresAt)} size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-wide leading-none" style={{ color: "#3F4B69" }}>Vendu par</p>
                      <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                        <p className="min-w-0 truncate font-bold text-ink text-xs">{shop.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {view === "shops" && shops.length === 0 && !isLoading && !loadError && (
          <div className="bg-white rounded-2xl border-[2.5px] border-ink p-10 text-center" style={{ boxShadow: "4px 4px 0 #0F1E3D" }}>
            <h3 className="font-bricolage font-bold text-ink text-lg mb-1">Aucune boutique trouvée</h3>
            <p className="text-sm mb-5" style={{ color: "#3F4B69" }}>
              Essaie un autre nom, un quartier ou un produit.
            </p>
            <button
              type="button"
              onClick={() => loadResults({ view: "shops", category: "Tous", query: "", page: 1 })}
              className="text-sm font-bold px-5 py-2.5 rounded-full border-[2px] border-ink active:scale-95 transition-transform"
              style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "2px 2px 0 #0F1E3D" }}
            >
              Voir toutes les boutiques
            </button>
          </div>
        )}

        {view === "shops" && shops.length > 0 && (
          <div className={`grid grid-cols-1 gap-3 transition-opacity duration-150 sm:grid-cols-2 md:gap-4 2xl:grid-cols-4 ${isLoading ? "opacity-60" : "opacity-100"}`}>
            {shops.map((shop, index) => (
              <Link
                key={shop.id}
                href={`/${shop.slug}`}
                prefetch={false}
                onPointerEnter={() => { void router.prefetch(`/${shop.slug}`); }}
                onFocus={() => { void router.prefetch(`/${shop.slug}`); }}
                onTouchStart={() => { void router.prefetch(`/${shop.slug}`); }}
                onClick={() => sessionStorage.setItem("jaayma:explorer-return", String(Date.now()))}
                className="group min-w-0 rounded-2xl border-[2.5px] border-ink p-4 active:scale-[0.99] transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: "#FFFBF2", boxShadow: "4px 4px 0 #0F1E3D" }}
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-visible rounded-2xl border-2 border-ink bg-white font-bricolage font-black text-xl text-ink" style={{ boxShadow: "2px 2px 0 #0F1E3D" }}>
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
                      {shop.logoKey ? (
                        <Image src={getImageUrl(shop.logoKey)!} alt={`Logo ${shop.name}`} width={56} height={56} className="h-full w-full object-contain" unoptimized />
                      ) : shop.name.slice(0, 1).toUpperCase()}
                    </div>
                    <ShopVerificationBadge plan={getEffectivePlan(shop.plan, shop.planExpiresAt)} size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bricolage font-black text-ink text-base leading-tight">{shop.name}</p>
                    <p className="mt-1 text-xs leading-snug line-clamp-2" style={{ color: "#3F4B69" }}>{shop.headline || shop.description || "Découvrez la boutique"}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {shop.category && <span className="rounded-full border border-ink/20 bg-[#FFC83D]/50 px-2 py-0.5 text-[10px] font-bold text-ink">{shop.category}</span>}
                      {(shop.area || shop.quartier) && <span className="rounded-full border border-ink/15 bg-white px-2 py-0.5 text-[10px] font-semibold text-ink">{shop.area || shop.quartier}</span>}
                    </div>
                  </div>
                </div>
                {shop.products && shop.products.length > 0 && (
                  <div className="mt-3 flex items-center justify-between border-t border-ink/15 pt-2.5">
                    <div className="flex -space-x-2">
                      {shop.products.slice(0, 3).map((product, productIndex) => {
                        const image = product.imageUrl ?? product.images?.[0]?.url;
                        const imageUrl = image ? getImageUrl(image) : null;
                        return (
                          <div key={product.id} className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#FFFBF2] bg-white" style={{ zIndex: 3 - productIndex }}>
                            {imageUrl ? <Image src={imageUrl} alt="" width={32} height={32} className="h-full w-full object-cover" unoptimized /> : <span className="flex h-full items-center justify-center text-[9px] font-bold text-ink">{index + 1}</span>}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-xs font-black text-ink group-hover:text-[#C8265A]">Voir la boutique <span aria-hidden="true">→</span></span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/*  Pagination  */}
        {(page > 1 || hasNextPage) && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {page > 1 && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handlePageChange(page - 1)}
                className="px-5 py-2.5 rounded-full border-[2px] border-ink font-bold text-sm active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0F1E3D", color: "#FFC83D" }}
              >Précédent</button>
            )}
            <span className="text-sm font-semibold text-ink">Page {page}</span>
            {hasNextPage && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handlePageChange(page + 1)}
                className="px-5 py-2.5 rounded-full border-[2px] border-ink font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-wait"
                style={{ backgroundColor: "#0F1E3D", color: "#FFC83D" }}
              >
                Suivant
              </button>
            )}
          </div>
        )}
        </section>

        {selectedProduct && (
          <ExploreProductSheet
            item={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onOpenShop={() => {
              sessionStorage.setItem("jaayma:explorer-return", String(Date.now()));
              router.push(`/${selectedProduct.shop.slug}?product=${encodeURIComponent(selectedProduct.product.id)}`, { scroll: true });
            }}
          />
        )}

        {/*  Lien inscription  */}
        <div className="mt-10 text-center md:col-span-2 md:justify-self-center">
          <Link href="/inscription" className="text-sm font-bold text-ink underline underline-offset-2">
            Tu es vendeur ? Créer ta boutique gratuitement
          </Link>
        </div>
      </div>

      {/* Bottom nav compacte inspirée de l'espace */}
      <nav
        aria-label="Navigation principale"
        className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 md:hidden"
      >
        <div className="flex items-center justify-between rounded-full border-[2.5px] border-ink bg-[#FFFBF2] p-1.5 text-ink shadow-[4px_4px_0_#0F1E3D]">
          {/* Accueil */}
          <Link
            href="/"
            prefetch={true}
            aria-label="Accueil"
            className="flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[#65708A] hover:bg-white hover:text-ink transition-colors active:scale-95"
          >
            <Home size={18} strokeWidth={2.4} />
            <span className="font-bricolage text-[11px] font-bold leading-none">Accueil</span>
          </Link>

          {/* Explorer (actif) */}
          <div
            className="flex items-center justify-center gap-1.5 rounded-full border-2 border-ink bg-sun px-3.5 py-1.5 text-ink shadow-[2px_2px_0_#0F1E3D]"
          >
            <Compass size={18} strokeWidth={2.6} />
            <span className="font-bricolage text-[11px] font-black leading-none whitespace-nowrap">Explorer</span>
          </div>

          {/* Vendre */}
          <Link
            href="/connexion"
            prefetch={true}
            aria-label="Vendre"
            className="flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[#65708A] hover:bg-white hover:text-ink transition-colors active:scale-95"
          >
            <Store size={18} strokeWidth={2.4} />
            <span className="font-bricolage text-[11px] font-bold leading-none">Vendre</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
