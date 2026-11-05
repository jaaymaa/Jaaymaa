"use server";

import { getCurrentSellerContext, getCurrentSellerId } from "@/lib/auth";
import { isAvailableSlug, suggestSlug } from "@/lib/slug";
import { normalizePhone } from "@/lib/phone";
import { DEFAULT_SHOP_THEME, SHOP_THEME_COLORS } from "@/lib/shop-theme";
import { revalidatePath, updateTag } from "next/cache";
import { getShopByOwner, createShop, updateShop } from "@/services/shop.service";
import { getEffectivePlan, isPaidPlan } from "@/lib/plans";

export async function upsertShop(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const sellerId = await getCurrentSellerId();
  if (!sellerId) {
    return { error: "Non autorisé. Veuillez vous connecter." };
  }

  const name = (formData.get("name") as string)?.trim();
  let slug = formData.get("slug") as string;
  const tagline = (formData.get("tagline") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const quartier = (formData.get("quartier") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const themeColor = (formData.get("themeColor") as string)?.trim() || DEFAULT_SHOP_THEME;
  const rawWhatsapp = formData.get("whatsapp") as string;
  const acceptsCash = formData.get("acceptsCash") === "on";
  const rawDeliveryFee = formData.get("deliveryFee") as string;
  const deliveryNote = (formData.get("deliveryNote") as string)?.trim();
  const isPublished = formData.get("isPublished") === "on";
  const logoKey = formData.has("logoKey")
    ? ((formData.get("logoKey") as string) || null)
    : undefined;
  const coverKey = formData.has("coverKey")
    ? ((formData.get("coverKey") as string) || null)
    : undefined;
  const rawWave = (formData.get("waveNumber") as string) || "";
  const hasWavePaymentLinkField = formData.has("wavePaymentLink");
  const rawWavePaymentLink = hasWavePaymentLinkField
    ? ((formData.get("wavePaymentLink") as string) || "").trim()
    : "";
  const rawOrange = (formData.get("orangeMoneyNumber") as string) || "";
  const facebookPixelId = (formData.get("facebookPixelId") as string)?.trim() || null;
  const tiktokPixelId = (formData.get("tiktokPixelId") as string)?.trim() || null;

  if (!name) {
    return { error: "Le nom de la boutique est obligatoire." };
  }

  if (!SHOP_THEME_COLORS.includes(themeColor as (typeof SHOP_THEME_COLORS)[number])) {
    return { error: "Cette couleur de boutique n’est pas disponible." };
  }

  slug = suggestSlug((slug || name).trim());

  if (!isAvailableSlug(slug)) {
    return { error: "Ce lien (slug) est invalide ou réservé. Utilisez 3 à 30 lettres, chiffres ou tirets." };
  }

  const whatsapp = rawWhatsapp ? normalizePhone(rawWhatsapp) : null;
  if (rawWhatsapp && !whatsapp) {
    return { error: "Le numéro WhatsApp n'est pas valide." };
  }

  const deliveryFee = rawDeliveryFee ? parseInt(rawDeliveryFee, 10) : 0;
  if (isNaN(deliveryFee) || deliveryFee < 0) {
    return { error: "Les frais de livraison sont invalides." };
  }

  const waveNumber = rawWave ? normalizePhone(rawWave) : null;
  if (rawWave && !waveNumber) {
    return { error: "Le numéro Wave n'est pas valide." };
  }
  const wavePaymentLink = rawWavePaymentLink ? normalizeWavePaymentLink(rawWavePaymentLink) : null;
  if (rawWavePaymentLink && !wavePaymentLink) {
    return { error: "Colle un lien marchand Wave valide (https://pay.wave.com/m/…)." };
  }
  const orangeMoneyNumber = rawOrange ? normalizePhone(rawOrange) : null;
  if (rawOrange && !orangeMoneyNumber) {
    return { error: "Le numéro Orange Money n'est pas valide." };
  }

  try {
    const ctx = await getCurrentSellerContext();
    const existingShop = ctx?.shop ?? (await getShopByOwner(sellerId));
    const canUseMarketingTools = isPaidPlan(getEffectivePlan(existingShop?.plan, existingShop?.planExpiresAt));

    const shopData = {
      ownerId: sellerId,
      name,
      slug,
      headline: tagline || "",
      area: quartier || "",
      description: description || "",
      category: category || null,
      themeColor,
      whatsapp,
      acceptsCash,
      deliveryFee,
      deliveryNote: deliveryNote || null,
      status: isPublished ? "ACTIVE" : "DRAFT",
      waveNumber,
      ...(hasWavePaymentLinkField ? { wavePaymentLink } : {}),
      orangeMoneyNumber,
      ...(canUseMarketingTools ? { facebookPixelId, tiktokPixelId } : {}),
      ...(logoKey !== undefined ? { logoUrl: logoKey } : {}),
      ...(coverKey !== undefined ? { coverUrl: coverKey } : {}),
    };

    if (existingShop) {
      await updateShop(existingShop.id, shopData, sellerId);
    } else {
      await createShop(shopData, sellerId);
    }

    updateTag("shops");
    revalidatePath("/espace", "layout");
    revalidatePath("/espace/boutique");
    revalidatePath("/explorer");
    revalidatePath(`/${slug}`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la sauvegarde.";
    return { error: msg };
  }
}

function normalizeWavePaymentLink(value: string): string | null {
  if (value.length > 500) return null;
  try {
    const url = new URL(value);
    const isWaveMerchantLink =
      url.protocol === "https:" &&
      url.hostname === "pay.wave.com" &&
      !url.username &&
      !url.password &&
      /^\/(?:m|mqr)\/[^/]+(?:\/[^/]+)*\/?$/.test(url.pathname);

    return isWaveMerchantLink ? url.toString() : null;
  } catch {
    return null;
  }
}
