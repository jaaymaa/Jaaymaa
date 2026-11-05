"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { upsertShop } from "../../actions/shop";
import { formatPhone } from "@/lib/phone";
import { suggestSlug } from "@/lib/slug";
import { DEFAULT_SHOP_THEME, getShopThemeForeground, SHOP_THEMES } from "@/lib/shop-theme";
import type { Shop } from "@/types/schema";
import ImageUploader from "@/components/ImageUploader";
import { useRouter } from "next/navigation";
import Link from "next/link";

const initialState: { error?: string; success?: boolean } = {};

const SHOP_CATEGORIES = [
  "Mode",
  "Beauté",
  "Alimentation",
  "Maison",
  "High-Tech",
  "Artisanat",
  "Autre",
];

export default function ShopForm({ shop, publicOrigin, canUseMarketingTools }: { shop: Shop | null; publicOrigin: string; canUseMarketingTools: boolean }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(upsertShop, initialState);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const isUploadingImage = isUploadingLogo || isUploadingCover;
  const [name, setName] = useState(shop?.name || "");
  const [slug, setSlug] = useState(shop?.slug || "");
  const [selectedCategory, setSelectedCategory] = useState(shop?.category || "");
  const [selectedTheme, setSelectedTheme] = useState(shop?.themeColor || DEFAULT_SHOP_THEME);
  const [waveNumber, setWaveNumber] = useState(
    shop?.waveNumber ? formatPhone(shop.waveNumber) : ""
  );
  const [wavePaymentLink, setWavePaymentLink] = useState(shop?.wavePaymentLink || "");
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState(
    shop?.orangeMoneyNumber ? formatPhone(shop.orangeMoneyNumber) : ""
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(shop?.slug));
  const [copiedFeed, setCopiedFeed] = useState(false);
  const publicHost = new URL(publicOrigin).host;
  const paymentAndDeliveryReady = Boolean(
    shop &&
      (shop.acceptsCash || shop.wavePaymentLink || shop.waveNumber || shop.orangeMoneyNumber) &&
      shop.deliveryNote?.trim()
  );

  useEffect(() => {
    if (shop) {
      setName(shop.name);
      setSlug(shop.slug);
      setSelectedCategory(shop.category || "");
      setSelectedTheme(shop.themeColor || DEFAULT_SHOP_THEME);
      setWaveNumber(shop.waveNumber ? formatPhone(shop.waveNumber) : "");
      setWavePaymentLink(shop.wavePaymentLink || "");
      setOrangeMoneyNumber(shop.orangeMoneyNumber ? formatPhone(shop.orangeMoneyNumber) : "");
    }
  }, [shop]);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="mx-auto min-h-screen max-w-xl p-5 pb-24 md:max-w-5xl md:px-8 xl:max-w-[1500px]" style={{ backgroundColor: "#0F1E3D" }}>
      <form action={formAction} className="space-y-6 md:grid md:grid-cols-2 md:items-start md:gap-8 md:space-y-0">
      <div className="space-y-6 md:space-y-5">
      {/*  HEADER  */}
      <div className="flex items-center gap-4 mb-10 mt-4 md:mb-2 md:mt-0">
        <ImageUploader
          currentKey={shop?.logoKey ?? null}
          inputName="logoKey"
          folder="logos"
          variant="avatar"
          tone="dark"
          label=""
          onUploadingChange={setIsUploadingLogo}
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-bricolage font-black text-white text-2xl leading-none mb-1">{shop ? (name || shop.name) : "Créer ta boutique"}</h1>
          <p className="text-xs font-bold leading-snug sm:text-sm" style={{ color: "#FFC83D", overflowWrap: "anywhere" }}>
            {shop ? (
              <>
                <span className="block">{publicHost}</span>
                <span className="block">/{slug || shop.slug}</span>
              </>
            ) : "Commence avec l’essentiel, tu pourras compléter ta vitrine après."}
          </p>
        </div>
      </div>

        {/*  NOM ET SLUG DE LA BOUTIQUE  */}
        <div id="profile-settings" className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>Nom de la boutique</label>
            <input
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                const next = e.target.value;
                setName(next);
                if (!slugTouched) setSlug(suggestSlug(next));
              }}
              placeholder="Awa Couture"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>Lien de la boutique</label>
            <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border-[2.5px] border-ink sm:flex-row sm:items-center" style={{ backgroundColor: "#FFFBF2" }}>
              <span className="px-4 pt-3 text-xs font-medium sm:shrink-0 sm:py-3.5" style={{ color: "#3F4B69", overflowWrap: "anywhere" }}>{publicHost}/</span>
              <input
                name="slug"
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="w-full min-w-0 px-4 pb-3 pt-1 text-sm font-bold outline-none bg-transparent sm:flex-1 sm:px-2 sm:py-3.5"
                style={{ color: "#0F1E3D" }}
              />
            </div>
          </div>

          {/*  CATÉGORIE (Pills)  */}
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: "#C3CCE6" }}>
              Catégorie d'activité
            </label>
            <input type="hidden" name="category" value={selectedCategory} />
            <div className="flex flex-wrap gap-2">
              {SHOP_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? "" : cat)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold border-[2px] transition-all active:scale-95"
                    style={{
                      backgroundColor: isSelected ? "#FFC83D" : "#16264D",
                      color: isSelected ? "#0F1E3D" : "#C3CCE6",
                      borderColor: isSelected ? "#0F1E3D" : "rgba(255,255,255,0.15)",
                      boxShadow: isSelected ? "2px 2px 0 #0F1E3D" : "none",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        <details id="storefront-settings" className="group rounded-2xl border border-white/10 bg-[#16264D]/45">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-bold text-white">
            <span>Personnaliser la vitrine</span>
            <span className="flex items-center gap-2 text-[11px] font-semibold text-[#C3CCE6]">
              Facultatif <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="space-y-4 border-t border-white/10 p-4">

          {/*  ACCROCHE / SLOGAN  */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>
              Slogan / Accroche courte
            </label>
            <input
              name="tagline"
              type="text"
              defaultValue={shop?.headline || shop?.tagline || ""}
              placeholder="Ex: Créations sur mesure & prêt-à-porter sénégalais"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
          </div>

          {/*  QUARTIER / VILLE  */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>
              Quartier / Ville
            </label>
            <input
              name="quartier"
              type="text"
              defaultValue={shop?.area || shop?.quartier || ""}
              placeholder="Ex: Mermoz, Dakar"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
          </div>

          {/*  DESCRIPTION  */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>
              Description détaillée
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={shop?.description || ""}
              placeholder="Présente ton univers, ton savoir-faire et tes produits..."
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun resize-none placeholder:text-[#8D98AF] placeholder:font-normal"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
          </div>

        <ImageUploader
          currentKey={shop?.coverKey ?? null}
          inputName="coverKey"
          folder="covers"
          label="Photo de couverture"
          aspectRatio="wide"
          tone="dark"
          onUploadingChange={setIsUploadingCover}
        />

        {/* Thème de la boutique */}
        <div>
          <input type="hidden" name="themeColor" value={selectedTheme} />
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <label className="block text-xs font-bold" style={{ color: "#C3CCE6" }}>Couleur de ta boutique</label>
              <p className="mt-1 text-[11px]" style={{ color: "#8D98AF" }}>Elle personnalisera l’en-tête de ta vitrine.</p>
            </div>
            <span className="text-xs font-bold" style={{ color: selectedTheme }}>{SHOP_THEMES.find(({ value }) => value === selectedTheme)?.name}</span>
          </div>
          <div className="flex flex-wrap gap-3" role="group" aria-label="Choisir la couleur de la boutique">
            {SHOP_THEMES.map((theme) => {
              const isSelected = selectedTheme === theme.value;
              return (
                <button
                  key={theme.value}
                  type="button"
                  onClick={() => setSelectedTheme(theme.value)}
                  aria-label={`Choisir le thème ${theme.name}`}
                  aria-pressed={isSelected}
                  title={theme.name}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-[2.5px] transition-transform active:scale-90 ${isSelected ? "border-white ring-2 ring-[#FFC83D] ring-offset-2 ring-offset-[#0F1E3D]" : "border-white/25 hover:border-white/70"}`}
                  style={{ backgroundColor: theme.value, color: getShopThemeForeground(theme.value) }}
                >
                  {isSelected && <Check className="h-5 w-5" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border-2 border-ink" style={{ backgroundColor: selectedTheme }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ color: getShopThemeForeground(selectedTheme) }}>
              <span className="font-bricolage text-sm font-black">{name || "Ma boutique"}</span>
              <span className="rounded-full border border-current/30 px-3 py-1 text-[10px] font-bold">Aperçu de l’en-tête</span>
            </div>
          </div>
        </div>
          </div>
        </details>
      </div>

        {/*  CONTACTS  */}
        <div className="space-y-6 md:col-start-2 md:row-start-1">
        <div className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>WhatsApp</label>
            <input
              name="whatsapp"
              type="tel"
              defaultValue={shop?.whatsapp ? formatPhone(shop.whatsapp) : ""}
              placeholder="77 123 45 67"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
          </div>

          <details
            id="payment-settings"
            className="group rounded-2xl border border-white/10 bg-[#16264D]/45"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-bold text-white">
              <span>Paiements et livraison</span>
              <span className="flex items-center gap-2 text-[11px] font-semibold text-[#C3CCE6]">
                {paymentAndDeliveryReady ? "Configuré" : "À compléter"}
                <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <div className="space-y-4 border-t border-white/10 p-4">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>Frais de livraison standard (FCFA)</label>
            <input
              name="deliveryFee"
              type="number"
              defaultValue={shop?.deliveryFee ?? 0}
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>Note & Délais de livraison</label>
            <input
              name="deliveryNote"
              type="text"
              defaultValue={shop?.deliveryNote || ""}
              placeholder="Ex: Livré sous 24h à Dakar, expédition partout au Sénégal"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>Lien de paiement marchand Wave (optionnel)</label>
            <input
              name="wavePaymentLink"
              type="url"
              value={wavePaymentLink}
              onChange={(e) => setWavePaymentLink(e.target.value)}
              placeholder="https://pay.wave.com/m/..."
              autoComplete="url"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "#C3CCE6" }}>
              Le client ouvrira ce lien et saisira ou vérifiera le total de sa commande dans Wave. Le paiement reste à confirmer par toi.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>Numéro Wave (si tu n’as pas de lien marchand)</label>
            <input
              name="waveNumber"
              type="tel"
              value={waveNumber}
              onChange={(e) => setWaveNumber(e.target.value)}
              placeholder="77 000 00 00"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>Numéro Orange Money</label>
            <input
              name="orangeMoneyNumber"
              type="tel"
              value={orangeMoneyNumber}
              onChange={(e) => setOrangeMoneyNumber(e.target.value)}
              placeholder="78 000 00 00"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
          </div>
            </div>
          </details>
        </div>

        {/*  MARKETING & PIXELS (Meta, TikTok, Catalogue)  */}
        <details className="group rounded-2xl border border-white/10 bg-[#16264D]/45">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-bold text-white">
            <span>Outils marketing</span>
            <span className="flex items-center gap-2 text-[11px] font-semibold text-[#C3CCE6]">
              {canUseMarketingTools ? "Inclus avec Pro et Pro+" : "Pro et Pro+"} <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="space-y-4 border-t border-white/10 p-4">
          {canUseMarketingTools ? <>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white">Tracking & Pixels Publicitaires</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#FFC83D] text-[#0F1E3D]">
                Marketing
              </span>
            </div>
            <p className="text-xs" style={{ color: "#8D98AF" }}>
              Connecte tes pixels pour tracker tes visites, conversions et optimiser tes pubs Facebook, Instagram et TikTok.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>
              ID Pixel Meta (Facebook & Instagram)
            </label>
            <input
              name="facebookPixelId"
              type="text"
              defaultValue={shop?.facebookPixelId || ""}
              placeholder="Ex: 1234567890123456"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal font-mono"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>
              ID Pixel TikTok
            </label>
            <input
              name="tiktokPixelId"
              type="text"
              defaultValue={shop?.tiktokPixelId || ""}
              placeholder="Ex: C1234567890ABCDEF"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal font-mono"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
          </div>

          {shop?.slug && (
            <div className="p-4 rounded-2xl border-[2px] border-dashed border-[#FFC83D]/40 bg-[#16264D]/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#FFC83D]">Flux Catalogue Produits (XML)</span>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${publicOrigin}/api/shops/${shop.slug}/catalog.xml`;
                    navigator.clipboard.writeText(url);
                    setCopiedFeed(true);
                    setTimeout(() => setCopiedFeed(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-white/20 hover:border-[#FFC83D] text-white transition-colors flex items-center gap-1.5"
                >
                  {copiedFeed ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#0E7C66]" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier le lien</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#8D98AF] leading-relaxed">
                Utilise ce lien dans Meta Commerce Manager ou TikTok Catalog pour synchroniser automatiquement tes produits et faire du retargeting.
              </p>
              <div className="text-[11px] font-mono p-2 rounded-xl bg-[#0F1E3D] text-[#C3CCE6] truncate border border-white/5 select-all">
                {`${publicOrigin}/api/shops/${shop.slug}/catalog.xml`}
              </div>
            </div>
          )}
          </> : (
            <div className="space-y-3 rounded-2xl border border-[#FFC83D]/30 bg-[#0F1E3D]/60 p-4">
              <p className="text-xs leading-5 text-[#C3CCE6]">
                Les pixels Meta et TikTok ainsi que le flux catalogue sont inclus dans les formules Pro et Pro+.
              </p>
              <Link
                href="/espace/abonnement"
                className="inline-flex min-h-10 items-center justify-center rounded-xl border-2 border-ink bg-sun px-4 text-xs font-black text-ink shadow-[2px_2px_0_#0F1E3D]"
              >
                Voir les forfaits Pro et Pro+
              </Link>
            </div>
          )}
          </div>
        </details>
        </div>

        {/*  TOGGLES  */}
        <div id="publication-settings" className="pt-6 space-y-5 md:col-span-2 md:mx-auto md:w-full md:max-w-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-white">Espèces à la livraison</span>
            <label className="relative inline-block w-11 h-6">
              <input
                type="checkbox"
                name="acceptsCash"
                defaultChecked={shop?.acceptsCash ?? true}
                className="peer sr-only"
              />
              <div className="w-11 h-6 rounded-full peer-checked:bg-[#0E7C66] bg-[#3A4A75] transition-colors"></div>
              <div className="absolute left-[4px] top-[4px] w-4 h-4 rounded-full bg-white transition-all peer-checked:left-[22px]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-white">Boutique visible</span>
            <label className="relative inline-block w-11 h-6">
              <input
                type="checkbox"
                name="isPublished"
                defaultChecked={shop?.isPublished ?? false}
                className="peer sr-only"
              />
              <div className="w-11 h-6 rounded-full peer-checked:bg-[#0E7C66] bg-[#3A4A75] transition-colors"></div>
              <div className="absolute left-[4px] top-[4px] w-4 h-4 rounded-full bg-white transition-all peer-checked:left-[22px]"></div>
            </label>
          </div>
        </div>

        {/* MESSAGES */}
        {state?.error && (
          <div className="p-4 rounded-xl border-[2px] text-sm font-bold mt-4 md:col-span-2" style={{ backgroundColor: "rgba(200,38,90,0.1)", borderColor: "#C8265A", color: "#C8265A" }}>
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="p-4 rounded-xl border-[2px] text-sm font-bold mt-4 md:col-span-2" style={{ backgroundColor: "rgba(14,124,102,0.1)", borderColor: "#0E7C66", color: "#0E7C66" }}>
             {shop ? "Modifications enregistrées !" : "Ta boutique a été créée !"}
          </div>
        )}

        {/*  BOUTON SAUVEGARDER  */}
        <div className="pt-8 md:col-span-2 md:mx-auto md:w-full md:max-w-2xl">
          <button
            type="submit"
            disabled={isPending || isUploadingImage}
            className="w-full py-4 rounded-full font-bold text-[15px] border-[2.5px] border-ink flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
            style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "4px 4px 0 #0F1E3D" }}
          >
            {isUploadingImage ? (
              <>
                <JaaymaLoader variant="mini-ink" size={32} />
                <span>Téléversement de la photo...</span>
              </>
            ) : isPending ? (
              <>
                <JaaymaLoader variant="mini-ink" size={32} />
                <span>Enregistrement en cours...</span>
              </>
            ) : (
              shop ? "Enregistrer les modifications" : "Créer ma boutique"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
