import { notFound } from "next/navigation";
import Image from "next/image";
import ProductList from "./ProductList";
import CartButton from "./CartButton";
import ShopBackButton from "./ShopBackButton";
import { formatFcfa } from "@/lib/money";
import { getImageUrl } from "@/lib/images";
import { waLink } from "@/lib/whatsapp";
import TrackVisit from "@/components/TrackVisit";
import MarketingPixel from "@/components/MarketingPixel";
import { cache } from "react";
import { getShopBySlug as getShopBySlugFromDb } from "@/services/shop.service";
import { DEFAULT_SHOP_THEME, getShopThemeForeground, SHOP_THEME_COLORS } from "@/lib/shop-theme";
import { getEffectivePlan, isPaidPlan } from "@/lib/plans";
import { getRequestOrigin } from "@/lib/site-url";
import { getSocialImageUrl } from "@/lib/social-metadata";
import ShopVerificationBadge from "@/components/ShopVerificationBadge";
import { MapPin, Truck, ShoppingBag } from "lucide-react";

export const revalidate = 60;

const getShopBySlug = cache(async (shopSlug: string) => {
  return getShopBySlugFromDb(shopSlug);
});

export async function generateMetadata({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop || !shop.isPublished) {
    return { title: "Boutique introuvable | Jaaymaa", robots: { index: false, follow: false } };
  }

  const origin = await getRequestOrigin();
  const url = new URL(`/${encodeURIComponent(shop.slug)}`, origin).toString();
  const title = `${shop.name} | Jaaymaa`;
  const description = (shop.tagline || shop.description || `Découvre la boutique ${shop.name} sur Jaaymaa.`)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  const firstProductImage = shop.products?.find((product) => product.imageUrls?.[0])?.imageUrls?.[0];
  const image = getSocialImageUrl(
    origin,
    getImageUrl(shop.coverKey ?? shop.coverUrl),
    firstProductImage,
    getImageUrl(shop.logoKey ?? shop.logoUrl),
  );

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "Jaaymaa",
      locale: "fr_SN",
      title,
      description,
      url,
      images: [{ url: image, alt: `Aperçu de la boutique ${shop.name}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/* ─── Wax band décorative (comme dans le design, entre header et produits) ─── */
function WaxBand({ color }: { color: string }) {
  return (
    <div className="relative" style={{ height: 24 }}>
      <svg viewBox="0 0 344 24" preserveAspectRatio="none" style={{ width: "100%", height: 24 }}>
        <defs>
          <pattern id="waxBand" width="36" height="24" patternUnits="userSpaceOnUse">
            <rect width="36" height="24" fill="#0F1E3D" />
            <polygon points="18,3 31,12 18,21 5,12" fill={color} />
          </pattern>
        </defs>
        <rect width="344" height="24" fill="url(#waxBand)" />
        <line x1="0" y1="0" x2="344" y2="0" stroke="#0F1E3D" strokeWidth="2.5" />
        <line x1="0" y1="24" x2="344" y2="24" stroke="#0F1E3D" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

function colorWithOpacity(color: string, opacity: number) {
  const safeColor = SHOP_THEME_COLORS.some((theme) => theme === color) ? color : DEFAULT_SHOP_THEME;
  const red = parseInt(safeColor.slice(1, 3), 16);
  const green = parseInt(safeColor.slice(3, 5), 16);
  const blue = parseInt(safeColor.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

export default async function ShopPage({ params, searchParams }: {
  params: Promise<{ shopSlug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ shopSlug }, { from }] = await Promise.all([params, searchParams]);

  const shop = await getShopBySlug(shopSlug);
  if (!shop || !shop.isPublished) notFound();
  const effectivePlan = getEffectivePlan(shop.plan, shop.planExpiresAt);
  const hasMarketingTools = isPaidPlan(effectivePlan);
  const themeColor = shop.themeColor && SHOP_THEME_COLORS.some((theme) => theme === shop.themeColor)
    ? shop.themeColor
    : DEFAULT_SHOP_THEME;
  const themeForeground = getShopThemeForeground(themeColor);
  const themeSecondaryText = shop.coverKey ? "#FFFFFF" : themeForeground === "#FFFFFF" ? "#FFE3EC" : "#29364F";

  const activeProducts = (shop.products ?? []).filter((p) => p.isActive);
  activeProducts.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const productsWithImages = activeProducts.map((product) => ({
    ...product,
    imageUrls: product.imageUrls ?? product.images?.map((i) => i.url) ?? [],
    imageUrl: product.imageUrl ?? product.images?.[0]?.url ?? null,
  }));

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: "#FFFBF2" }}>
      <TrackVisit shopId={shop.id} />
      <MarketingPixel
        facebookPixelId={hasMarketingTools ? shop.facebookPixelId : null}
        tiktokPixelId={hasMarketingTools ? shop.tiktokPixelId : null}
        event="PageView"
        eventData={{
          content_name: shop.name,
          content_type: "storefront",
        }}
      />

      {/* ─── HEADER BOUTIQUE (fond Hibiscus) ─── */}
      <div className="relative overflow-hidden" style={{ backgroundColor: themeColor }}>
        {shop.coverKey && (
          <>
            <Image
              src={getImageUrl(shop.coverKey)!}
              alt={`Couverture de ${shop.name}`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              unoptimized
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  `linear-gradient(135deg, ${colorWithOpacity(themeColor, 0.68)}, rgba(15,30,61,0.58))`,
              }}
            />
          </>
        )}
        <div className="relative z-10">
        {/* Status bar */}
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 pb-0 pt-4 md:max-w-5xl">
          {/* Bouton retour */}
          <ShopBackButton returnToSeller={from === "seller"} />
          {/* Bouton WhatsApp / Chat */}
          {shop.whatsapp && (
            <a
              href={waLink(shop.whatsapp)}
              target="_blank"
              rel="noreferrer"
              data-ga-event="generate_lead"
              data-ga-method="whatsapp"
              data-ga-shop={shop.slug}
              className="w-9 h-9 rounded-full bg-white border-[2px] border-ink flex items-center justify-center active:scale-90 transition-transform"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F1E3D" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5h16v11H9l-5 4z" />
              </svg>
            </a>
          )}
        </div>

          {/* Shop name + info */}
          <div className="mx-auto max-w-xl px-5 pb-4 pt-6 md:max-w-5xl md:px-8 md:pb-8 md:pt-8">
            <div className="flex items-center gap-3 mb-1">
              {shop.logoKey && (
              <div className="relative h-14 w-14 shrink-0 overflow-visible rounded-full border-[3px] border-white bg-white shadow-[3px_3px_0_#0F1E3D] sm:h-16 sm:w-16">
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <Image
                    src={getImageUrl(shop.logoKey)!}
                    alt={`Logo de ${shop.name}`}
                    fill
                    sizes="(min-width: 640px) 64px, 56px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <ShopVerificationBadge plan={effectivePlan} size={24} />
              </div>
              )}
              <h1 className="min-w-0 font-bricolage font-black leading-tight" style={{ color: themeForeground, fontSize: "clamp(1.5rem, 8vw, 3rem)", letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>
                {shop.name}
              </h1>
            </div>
            {(shop.headline || shop.tagline || shop.area || shop.quartier) && (
              <div className="flex flex-wrap items-center gap-x-2 text-sm font-medium mb-2.5" style={{ color: themeSecondaryText }}>
                {(shop.headline || shop.tagline) && (
                  <span>{shop.headline || shop.tagline}</span>
                )}
                {(shop.headline || shop.tagline) && (shop.area || shop.quartier) && (
                  <span className="opacity-60">•</span>
                )}
                {(shop.area || shop.quartier) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} className="shrink-0 text-white/80" />
                    <span>{shop.area || shop.quartier}</span>
                  </span>
                )}
              </div>
            )}

            {shop.description && (
              <p className="mb-3.5 max-w-lg rounded-xl border border-white/10 bg-black/15 p-3 text-xs leading-relaxed backdrop-blur-sm" style={{ color: themeSecondaryText }}>
                {shop.description}
              </p>
            )}

            {/* Chips : catégorie et livraison */}
            <div className="flex flex-wrap gap-2">
              {shop.category && (
                <span className="text-xs font-bold px-3.5 py-1.5 rounded-full border-[2px] border-ink" style={{ backgroundColor: themeColor, color: themeForeground, boxShadow: "2px 2px 0 #0F1E3D" }}>
                  {shop.category}
                </span>
              )}
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full border-[2px] border-ink bg-white" style={{ color: "#0F1E3D", boxShadow: "2px 2px 0 #0F1E3D" }}>
                Livraison {shop.deliveryFee === 0 ? "gratuite" : formatFcfa(shop.deliveryFee)}
              </span>
              {shop.deliveryNote && (
                <span className="text-xs font-bold px-3.5 py-1.5 rounded-full border-[2px] border-ink bg-white/90 text-[#0F1E3D] inline-flex items-center gap-1.5" style={{ boxShadow: "2px 2px 0 #0F1E3D" }}>
                  <Truck size={13} className="shrink-0 text-[#0F1E3D]" />
                  <span>{shop.deliveryNote}</span>
                </span>
              )}
            </div>
          </div>

        {/* Wax band décorative */}
        <WaxBand color={themeColor} />
        </div>
      </div>

      {/* ─── GRILLE PRODUITS ─── */}
      <div className="mx-auto max-w-xl px-4 pt-5 md:max-w-[1500px] md:px-8 md:pt-8">
        {activeProducts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border-[2.5px] border-ink" style={{ backgroundColor: "#FFFBF2" }}>
            <div className="w-16 h-16 rounded-2xl bg-[#FFC83D]/20 border-2 border-ink flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0_#0F1E3D]">
              <ShoppingBag size={28} className="text-[#0F1E3D]" />
            </div>
            <p className="font-bricolage font-bold text-ink">Aucun produit disponible</p>
            <p className="text-sm mt-1" style={{ color: "#3F4B69" }}>Cette boutique n'a pas encore de produits.</p>
          </div>
        ) : (
          <ProductList products={productsWithImages} shopId={shop.id} shopSlug={shop.slug} themeColor={themeColor} />
        )}
      </div>

      {/* ─── Barre panier flottante ─── */}
      <CartButton shopId={shop.id} shopSlug={shop.slug} themeColor={themeColor} />
    </div>
  );
}
