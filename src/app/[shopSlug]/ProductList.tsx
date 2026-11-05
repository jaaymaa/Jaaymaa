"use client";

import { useCartStore } from "@/lib/cart-store";
import ProductImageFrame, { WAX_PATTERNS } from "@/components/ProductImageFrame";
import PriceDisplay from "@/components/PriceDisplay";
import type { Product, ProductOption } from "@/types/schema";
import { formatFcfa } from "@/lib/money";
import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import FormattedDescription from "@/components/FormattedDescription";
import { trackAnalyticsEvent } from "@/lib/analytics";

/* ─── Product modal (fiche produit — design 04) ─── */
type ProductCard = Product & { imageUrl?: string | null; imageUrls?: string[]; _count?: { images: number } };
const PRODUCTS_PER_PAGE = 12;

function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
}

function ProductModal({
  product,
  themeColor,
  onClose,
  onAdd,
}: {
  product: ProductCard;
  themeColor: string;
  onClose: () => void;
  onAdd: (product: Product, selectedOptions?: Record<string, string>, qty?: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpening, setIsOpening] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const touchGestureRef = useRef<{
    startX: number;
    startY: number;
    startScrollTop: number;
    startedAt: number;
    canDismiss: boolean;
    dragging: boolean;
    cancelled: boolean;
  } | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const isClosingRef = useRef(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragOffsetYRef = useRef(0);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const themeForeground = themeColor.toUpperCase() === "#FFC83D" ? "#0F1E3D" : "#FFFFFF";

  const productOptions: ProductOption[] = (() => {
    if (!product.optionsJson) return [];
    try {
      const parsed = JSON.parse(product.optionsJson);
      return Array.isArray(parsed)
        ? parsed.filter(
            (o) => o?.name && Array.isArray(o?.values) && o.values.length > 0
          )
        : [];
    } catch {
      return [];
    }
  })();

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const opt of productOptions) {
      if (opt.values[0]) {
        initial[opt.name] = opt.values[0];
      }
    }
    return initial;
  });

  const imageUrls = product.imageUrls?.length
    ? product.imageUrls
    : product.imageUrl
      ? [product.imageUrl]
      : [];
  const wax = WAX_PATTERNS[Math.abs(product.name.charCodeAt(0)) % WAX_PATTERNS.length];

  const requestClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsDragging(false);
    setIsClosing(true);
    closeTimeoutRef.current = window.setTimeout(() => onCloseRef.current(), 260);
  }, []);

  useEffect(() => {
    const openingFrame = window.requestAnimationFrame(() => setIsOpening(false));
    const body = document.body;
    const scrollY = window.scrollY;
    const previousBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      overscrollBehavior: body.style.overscrollBehavior,
    };

    // Lock the page behind the sheet, including mobile Safari where overflow:hidden alone can leak scroll.
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const sheet = sheetRef.current;
      if (!touch || !sheet || event.touches.length !== 1) {
        touchGestureRef.current = null;
        return;
      }
      touchGestureRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startScrollTop: sheet.scrollTop,
        startedAt: performance.now(),
        canDismiss: sheet.scrollTop <= 1,
        dragging: false,
        cancelled: false,
      };
    };
    const handleTouchMove = (event: TouchEvent) => {
      const gesture = touchGestureRef.current;
      const touch = event.touches[0];
      const sheet = sheetRef.current;
      if (!gesture || !touch || !sheet || gesture.cancelled || !gesture.canDismiss || sheet.scrollTop > 1 || isClosingRef.current) return;

      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;
      if (Math.abs(deltaX) > Math.abs(deltaY) + 5) {
        gesture.cancelled = true;
        return;
      }
      if (deltaY <= 0) {
        if (deltaY < -6) gesture.cancelled = true;
        return;
      }
      if (deltaY < 6) return;

      event.preventDefault();
      gesture.dragging = true;
      setIsDragging(true);
      dragOffsetYRef.current = deltaY;
      setDragOffsetY(deltaY);
    };
    const finishTouchGesture = (touch?: Touch) => {
      const gesture = touchGestureRef.current;
      touchGestureRef.current = null;
      if (!gesture?.dragging) return;
      const finalDelta = touch ? touch.clientY - gesture.startY : dragOffsetYRef.current;
      const gestureDuration = performance.now() - gesture.startedAt;
      if (finalDelta >= 90 || (finalDelta >= 55 && gestureDuration < 240)) {
        requestClose();
      } else {
        setIsDragging(false);
        dragOffsetYRef.current = 0;
        setDragOffsetY(0);
      }
    };
    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length > 0) return;
      finishTouchGesture(event.changedTouches[0]);
    };
    const handleTouchCancel = () => {
      touchGestureRef.current = null;
      setIsDragging(false);
      dragOffsetYRef.current = 0;
      setDragOffsetY(0);
    };

    window.addEventListener("keydown", handleKeyDown);
    const sheet = sheetRef.current;
    sheet?.addEventListener("touchstart", handleTouchStart, { passive: true });
    sheet?.addEventListener("touchmove", handleTouchMove, { passive: false });
    sheet?.addEventListener("touchend", handleTouchEnd, { passive: true });
    sheet?.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      window.cancelAnimationFrame(openingFrame);
      window.removeEventListener("keydown", handleKeyDown);
      sheet?.removeEventListener("touchstart", handleTouchStart);
      sheet?.removeEventListener("touchmove", handleTouchMove);
      sheet?.removeEventListener("touchend", handleTouchEnd);
      sheet?.removeEventListener("touchcancel", handleTouchCancel);
      if (closeTimeoutRef.current !== null) window.clearTimeout(closeTimeoutRef.current);
      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.left = previousBodyStyles.left;
      body.style.right = previousBodyStyles.right;
      body.style.width = previousBodyStyles.width;
      body.style.overflow = previousBodyStyles.overflow;
      body.style.overscrollBehavior = previousBodyStyles.overscrollBehavior;
      window.scrollTo(0, scrollY);
    };
  }, [requestClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        opacity: isClosing ? 0 : isOpening ? 0 : Math.max(0.15, 1 - dragOffsetY / 250),
        transition: isDragging ? "none" : "opacity 240ms ease-out",
      }}
      onClick={requestClose}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-xl max-h-[92dvh] overflow-y-auto overscroll-y-contain"
        style={{
          backgroundColor: "#FFFBF2",
          borderRadius: "34px 34px 0 0",
          border: "2.5px solid #0F1E3D",
          touchAction: "pan-y",
          transform: isClosing ? "translate3d(0, 100%, 0)" : `translate3d(0, ${isOpening ? "100%" : `${dragOffsetY}px`}, 0)`,
          transition: isDragging
            ? "none"
            : isOpening
              ? "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
          overscrollBehaviorY: "contain",
          WebkitOverflowScrolling: "touch",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div
          className="flex flex-col items-center pt-2.5 pb-1 select-none"
          aria-hidden="true"
        >
          <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: "#D8DCE8" }} />
        </div>

        {/* Image produit (wax pattern) */}
        <div
          className="mx-4 rounded-2xl border-[2px] border-ink overflow-hidden relative"
          style={{ height: 220 }}
        >
          <ProductImageFrame imageUrl={imageUrls[activeImageIndex]} alt={`${product.name}, photo ${activeImageIndex + 1}`} wax={wax} height={220} loading="eager" />
          {/* Badge Nouveau */}
          <span
            className="absolute top-3 left-3 text-xs font-bold px-3 py-1.5 rounded-full border-[2px] border-ink"
            style={{ backgroundColor: themeColor, color: themeForeground }}
          >
            Nouveau
          </span>
          {imageUrls.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Photo précédente"
                onClick={() => setActiveImageIndex((index) => (index - 1 + imageUrls.length) % imageUrls.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-2 border-ink bg-white/95 flex items-center justify-center font-black text-ink shadow"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Photo suivante"
                onClick={() => setActiveImageIndex((index) => (index + 1) % imageUrls.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-2 border-ink bg-white/95 flex items-center justify-center font-black text-ink shadow"
              >
                ›
              </button>
              <span className="absolute bottom-3 right-3 rounded-full border border-white/60 bg-ink/85 px-2.5 py-1 text-xs font-bold text-white">
                {activeImageIndex + 1} / {imageUrls.length}
              </span>
            </>
          )}
        </div>
        {imageUrls.length > 1 && (
          <div className="mx-4 mt-2 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Photos du produit">
            {imageUrls.map((url: string, index: number) => (
              <button
                key={`${url}-${index}`}
                type="button"
                aria-label={`Afficher la photo ${index + 1}`}
                aria-pressed={activeImageIndex === index}
                onClick={() => setActiveImageIndex(index)}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${activeImageIndex === index ? "border-[#C8265A]" : "border-ink/30"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" loading="lazy" className="h-full w-full bg-white object-contain p-0.5" />
              </button>
            ))}
          </div>
        )}

        {/* Contenu */}
        <div className="px-5 pt-4 pb-6">
          <h2 className="font-bricolage font-black text-2xl text-ink mb-1" style={{ letterSpacing: "-0.02em" }}>
            {product.name}
          </h2>
          <PriceDisplay amount={product.price} className="mb-2 text-[25px] leading-tight text-[#C8265A]" />
          {product.description && (
            <section className="mb-5 mt-5 border-t border-ink/10 pt-4" aria-label="Description du produit">
              <div className="mb-2.5 flex items-center gap-2">
                <span aria-hidden="true" className="h-4 w-1 rounded-full bg-[#C8265A]" />
                <h3 className="font-bricolage text-[13px] font-black tracking-[-0.01em] text-ink">À propos de cet article</h3>
              </div>
              <FormattedDescription text={product.description} className="space-y-2 text-[14px] leading-[1.8] text-[#46536F]" />
            </section>
          )}

          {/* Options & Variantes dynamiques (Taille, Couleur, Pointure...) */}
          {productOptions.length > 0 && (
            <div className="space-y-4 mb-5 pt-1">
              {productOptions.map((opt) => (
                <div key={opt.name}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-ink uppercase tracking-wider">
                      {opt.name}
                    </p>
                    <span className="text-xs font-bold" style={{ color: themeColor }}>
                      {selectedOptions[opt.name] || "Sélectionne"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val) => {
                      const isSelected = selectedOptions[opt.name] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            setSelectedOptions((prev) => ({
                              ...prev,
                              [opt.name]: val,
                            }))
                          }
                          className="px-3.5 py-2 rounded-xl text-xs font-bold border-[2px] transition-all active:scale-95"
                          style={{
                            backgroundColor: isSelected ? themeColor : "#FFFBF2",
                            borderColor: "#0F1E3D",
                            color: isSelected ? themeForeground : "#0F1E3D",
                            boxShadow: isSelected ? "2px 2px 0 #0F1E3D" : "none",
                            transform: isSelected ? "scale(1.02)" : "scale(1)",
                          }}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantité + Ajouter */}
          <div className="flex items-center gap-3">
            {/* Qty selector */}
            <div className="flex items-center border-[2.5px] border-ink rounded-full overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-11 h-12 flex items-center justify-center text-xl font-bold text-ink"
              >
                −
              </button>
              <span className="w-8 text-center text-base font-black font-bricolage text-ink">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-11 h-12 flex items-center justify-center text-xl font-bold text-ink"
              >
                +
              </button>
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                onAdd(product, selectedOptions, qty);
                onClose();
              }}
              className="flex-1 py-3.5 rounded-full font-bold text-sm border-[2.5px] border-ink transition-transform active:scale-95"
              style={{ backgroundColor: themeColor, color: themeForeground, boxShadow: "4px 4px 0 #0F1E3D" }}
            >
              Ajouter {formatFcfa(product.price * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Product Grid ─── */
export default function ProductList({
  products,
  shopId,
  shopSlug,
  themeColor,
}: {
  products: ProductCard[];
  shopId: string;
  shopSlug: string;
  themeColor: string;
}) {
  const { addItem, items, shopId: cartShopId, clearCart } = useCartStore();
  const [modalProduct, setModalProduct] = useState<ProductCard | null>(null);
  const skipNextModalScrollRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const hashHandledRef = useRef(false);
  const themeForeground = themeColor.toUpperCase() === "#FFC83D" ? "#0F1E3D" : "#FFFFFF";
  const [pendingShopSwitch, setPendingShopSwitch] = useState<{
    product: Product;
    selectedOptions?: Record<string, string>;
    qty: number;
  } | null>(null);

  const handleAdd = (
    product: Product,
    selectedOptions?: Record<string, string>,
    qty: number = 1
  ) => {
    if (cartShopId && cartShopId !== shopId) {
      setPendingShopSwitch({ product, selectedOptions, qty });
      return;
    }
    addItem(product, selectedOptions, qty);
    trackAnalyticsEvent("add_to_cart", {
      currency: "XOF",
      value: product.price * qty,
      items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: qty }],
    });
  };

  const handleCardAdd = (e: React.MouseEvent, product: ProductCard) => {
    e.stopPropagation();
    let hasOptions = false;
    try {
      if (product.optionsJson) {
        const parsed = JSON.parse(product.optionsJson);
        hasOptions = Array.isArray(parsed) && parsed.length > 0;
      }
    } catch {}

    if (hasOptions) {
      setModalProduct(product);
    } else {
      handleAdd(product);
    }
  };

  const handleTap = (product: ProductCard) => {
    trackAnalyticsEvent("view_item", {
      currency: "XOF",
      value: product.price,
      items: [{ item_id: product.id, item_name: product.name, price: product.price }],
    });
    setModalProduct(product);
  };

  const normalizedQuery = normalizeSearchText(searchQuery.trim());
  const filteredProducts = normalizedQuery
    ? products.filter((product) =>
        normalizeSearchText(`${product.name} ${product.description || ""}`).includes(normalizedQuery)
      )
    : products;
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );
  const firstVisiblePage = Math.min(Math.max(1, currentPage - 2), Math.max(1, pageCount - 4));
  const visiblePageNumbers = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => firstVisiblePage + index
  );

  useEffect(() => {
    if (hashHandledRef.current) return;
    const hashMatch = window.location.hash.match(/^#product-(.+)$/);
    const requestedProductId = new URLSearchParams(window.location.search).get("product")
      ?? (hashMatch ? hashMatch[1] : null);
    if (!requestedProductId) return;

    let productId: string;
    try {
      productId = decodeURIComponent(requestedProductId);
    } catch {
      return;
    }
    const target = products.find((product) => product.id === productId);
    if (!target) return;

    hashHandledRef.current = true;
    const productIndex = products.findIndex((product) => product.id === productId);
    skipNextModalScrollRef.current = true;
    setPage(Math.floor(productIndex / PRODUCTS_PER_PAGE) + 1);
    setModalProduct(target);
    window.scrollTo(0, 0);
  }, [products]);

  useEffect(() => {
    if (!modalProduct) return;
    if (skipNextModalScrollRef.current) {
      skipNextModalScrollRef.current = false;
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`product-${modalProduct.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [modalProduct, currentPage]);

  useEffect(() => {
    if (!modalProduct || (modalProduct._count && modalProduct._count.images <= 1) || (modalProduct.imageUrls?.length ?? 0) > 1) return;
    let cancelled = false;
    void fetch(`/api/shops/${encodeURIComponent(shopSlug)}/products/${encodeURIComponent(modalProduct.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        const fullProduct = data as (Product & { imageUrls?: string[] }) | null;
        const imageUrls = fullProduct?.imageUrls ?? [];
        if (cancelled || imageUrls.length === 0) return;
        setModalProduct((current) => current?.id === modalProduct.id
          ? { ...current, ...(fullProduct || {}), imageUrls, imageUrl: imageUrls[0] }
          : current);
      }).catch(() => {
      // Keep the cover photo visible if the optional gallery request fails.
    });
    return () => { cancelled = true; };
  }, [modalProduct, shopSlug]);

  const closeProductModal = () => {
    setModalProduct(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("product");
    if (url.hash.startsWith("#product-")) url.hash = "";
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <>
      <section id="catalogue-top" aria-label="Catalogue de la boutique" className="mb-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-bricolage text-2xl font-black leading-tight text-ink">Les produits</h2>
            <p className="mt-1 text-xs font-medium text-[#3F4B69]">
              {filteredProducts.length} {filteredProducts.length > 1 ? "articles" : "article"}{searchQuery.trim() ? " trouvé(s)" : ""}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-ink/20 bg-[#FFC83D]/40 px-3 py-1.5 text-[10px] font-bold text-ink">{products.length} {products.length > 1 ? "références" : "référence"}</span>
        </div>

        {products.length > 0 && (
          <label className="mb-4 flex items-center gap-3 rounded-2xl border-[2px] border-ink bg-white px-4 py-3 shadow-[3px_3px_0_#0F1E3D] focus-within:ring-2 focus-within:ring-[#FFC83D]">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0F1E3D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Rechercher un produit"
              aria-label="Rechercher un produit dans la boutique"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:font-normal placeholder:text-[#78819A]"
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(""); setPage(1); }} className="rounded-full px-2 py-1 text-xs font-bold text-[#C8265A]" aria-label="Effacer la recherche">
                Effacer
              </button>
            )}
          </label>
        )}

        {visibleProducts.length === 0 ? (
          <div className="rounded-2xl border-[2.5px] border-ink bg-white px-5 py-10 text-center shadow-[3px_3px_0_#0F1E3D]">
            <p className="font-bricolage text-lg font-black text-ink">Aucun produit trouvé</p>
            <p className="mt-1 text-sm text-[#3F4B69]">Essaie un autre nom ou efface ta recherche.</p>
          </div>
        ) : (
      <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 md:grid-cols-3 md:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
        {visibleProducts.map((product, i) => {
          const wax = WAX_PATTERNS[i % WAX_PATTERNS.length];
          const qty = items
            .filter((it) => it.product.id === product.id)
            .reduce((sum, it) => sum + it.quantity, 0);

          let optionCount = 0;
          try {
            if (product.optionsJson) {
              const parsed = JSON.parse(product.optionsJson);
              if (Array.isArray(parsed)) optionCount = parsed.length;
            }
          } catch {}

          return (
            <div
              key={product.id}
              id={`product-${product.id}`}
              className="rounded-2xl border-[2.5px] border-ink overflow-hidden cursor-pointer active:scale-95 transition-transform"
              style={{ backgroundColor: "#FFFBF2", boxShadow: "4px 4px 0 #0F1E3D" }}
              onClick={() => handleTap(product)}
            >
              {/* Wax pattern */}
              <div className="relative">
                <ProductImageFrame imageUrl={product.imageUrl} alt={product.name} wax={wax} height={190} />
                {/* Dot favori */}
                <span
                  className="absolute top-2 right-2 w-3 h-3 rounded-full border-[2px] border-ink"
                  style={{ backgroundColor: "#C8265A" }}
                />
                {product.imageUrls && product.imageUrls.length > 1 && (
                  <span className="absolute top-2 left-2 rounded-full border border-ink bg-white/95 px-2 py-1 text-[10px] font-bold text-ink">
                    {product.imageUrls.length} photos
                  </span>
                )}
                {optionCount > 0 && (
                  <span className="absolute bottom-2 left-2 rounded-full border border-ink px-2 py-0.5 text-[10px] font-bold shadow-sm" style={{ backgroundColor: themeColor, color: themeForeground }}>
                    Variantes
                  </span>
                )}
              </div>

              {/* Infos */}
              <div className="px-2.5 pt-2 pb-3 flex items-end justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink truncate leading-tight">{product.name}</p>
                  <PriceDisplay amount={product.price} className="text-[clamp(1.125rem,6vw,1.5625rem)] leading-tight text-ink" />
                </div>
                {/* Plus button */}
                <button
                  onClick={(e) => handleCardAdd(e, product)}
                  className="w-8 h-8 rounded-full border-[2px] border-ink flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                  style={{ backgroundColor: qty > 0 ? "#0E7C66" : themeColor, color: qty > 0 ? "#FFFFFF" : themeForeground }}
                  aria-label={optionCount > 0 ? `Choisir les options pour ${product.name}` : `Ajouter ${product.name} au panier`}
                >
                  {qty > 0 ? (
                    <span className="text-white text-xs font-black">{qty}</span>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={themeForeground} strokeWidth="2.8" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
        )}

        {pageCount > 1 && (
          <nav className="mt-7 flex flex-wrap items-center justify-center gap-2" aria-label="Pages de produits">
            <button
              type="button"
              onClick={() => { setPage(Math.max(1, currentPage - 1)); document.getElementById("catalogue-top")?.scrollIntoView({ behavior: "smooth" }); }}
              disabled={currentPage === 1}
              className="h-10 rounded-full border-2 border-ink px-4 text-sm font-bold text-ink transition-transform active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: "#FFFBF2" }}
            >Précédent</button>
            {visiblePageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                aria-current={pageNumber === currentPage ? "page" : undefined}
                className="h-10 min-w-10 rounded-full border-2 border-ink px-3 text-sm font-black transition-transform active:scale-95"
                onClick={() => { setPage(pageNumber); document.getElementById("catalogue-top")?.scrollIntoView({ behavior: "smooth" }); }}
                style={{
                  backgroundColor: pageNumber === currentPage ? themeColor : "#FFFBF2",
                  color: pageNumber === currentPage ? themeForeground : "#0F1E3D",
                  boxShadow: pageNumber === currentPage ? "2px 2px 0 #0F1E3D" : "none",
                }}
              >{pageNumber}</button>
            ))}
            <button
              type="button"
              onClick={() => { setPage(Math.min(pageCount, currentPage + 1)); document.getElementById("catalogue-top")?.scrollIntoView({ behavior: "smooth" }); }}
              disabled={currentPage === pageCount}
              className="h-10 rounded-full border-2 border-ink px-4 text-sm font-bold text-[#FFC83D] transition-transform active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: "#0F1E3D" }}
            >Suivant</button>
          </nav>
        )}
      </section>

      {/* Modal fiche produit */}
      {modalProduct && (
        <ProductModal
          key={modalProduct.id}
          product={modalProduct}
          themeColor={themeColor}
          onClose={closeProductModal}
          onAdd={handleAdd}
        />
      )}

      {/* Modal confirmation changement de boutique */}
      <ConfirmModal
        isOpen={pendingShopSwitch !== null}
        onClose={() => setPendingShopSwitch(null)}
        onConfirm={() => {
          if (pendingShopSwitch) {
            clearCart();
            addItem(
              pendingShopSwitch.product,
              pendingShopSwitch.selectedOptions,
              pendingShopSwitch.qty
            );
            trackAnalyticsEvent("add_to_cart", {
              currency: "XOF",
              value: pendingShopSwitch.product.price * pendingShopSwitch.qty,
              items: [{
                item_id: pendingShopSwitch.product.id,
                item_name: pendingShopSwitch.product.name,
                price: pendingShopSwitch.product.price,
                quantity: pendingShopSwitch.qty,
              }],
            });
            setPendingShopSwitch(null);
          }
        }}
        title="Changer de boutique ?"
        description="Votre panier contient des articles d'une autre boutique. En continuant, votre panier actuel sera vidé."
        confirmLabel="Vider et continuer"
        cancelLabel="Conserver mon panier"
        variant="warning"
        icon="warning"
      />
    </>
  );
}
