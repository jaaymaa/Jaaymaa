"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSellerContext } from "@/lib/auth";
import {
  isUserAdmin,
  setExplorerEnabled as setExplorerEnabledService,
  setMaintenanceEnabled as setMaintenanceEnabledService,
  setProPrice as setProPriceService,
  setProPlusPrice as setProPlusPriceService,
  adminUpdateShopPlan as adminUpdateShopPlanService,
  adminUpdateShopStatus as adminUpdateShopStatusService,
} from "@/services/admin.service";
import { sendAdminPushAnnouncement } from "@/services/notification.service";

async function requireAdmin() {
  const ctx = await getCurrentSellerContext();
  if (!ctx || !ctx.phone) {
    throw new Error("Connectez-vous pour accéder à l’administration.");
  }

  if (!isUserAdmin(ctx.phone)) {
    throw new Error("Ce compte n’est pas autorisé à accéder au panneau d’administration.");
  }

  return ctx;
}

type AdminAnnouncementState = {
  error?: string;
  success?: boolean;
  deliveredCount?: number;
  targetCount?: number;
  failedCount?: number;
};

export async function checkIsAdmin(): Promise<{
  isAdmin: boolean;
  phone?: string;
  error?: string;
  denialReason?: "login" | "session" | "not-admin" | "verification-error";
}> {
  try {
    const ctx = await getCurrentSellerContext();
    if (!ctx) {
      return {
        isAdmin: false,
        denialReason: "login",
        error: "Connectez-vous pour accéder à l’administration.",
      };
    }

    if (!isUserAdmin(ctx.phone)) {
      return {
        isAdmin: false,
        denialReason: "not-admin",
        error: "Ce compte n’est pas autorisé à accéder au panneau d’administration.",
      };
    }

    return { isAdmin: true, phone: ctx.phone };
  } catch (error) {
    return {
      isAdmin: false,
      denialReason: "verification-error",
      error: error instanceof Error ? error.message : "Erreur de vérification.",
    };
  }
}

export async function setShopPlan(
  shopId: string,
  plan: "free" | "pro" | "pro_plus"
) {
  try {
    await requireAdmin();
    await adminUpdateShopPlanService(shopId, plan, plan === "free" ? 0 : 30);

    revalidatePath("/admin");
    revalidatePath("/admin/abonnements");
    revalidatePath("/admin/boutiques");
    revalidatePath("/espace/abonnement");
    revalidatePath("/espace");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la mise à jour.";
    return { error: msg };
  }
}

export async function setShopSuspension(shopId: string, isSuspended: boolean) {
  try {
    await requireAdmin();
    await adminUpdateShopStatusService(shopId, isSuspended ? "SUSPENDED" : "ACTIVE");

    revalidatePath("/admin");
    revalidatePath("/explorer");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la suspension.";
    return { error: msg };
  }
}

export async function setExplorerEnabled(enabled: boolean) {
  try {
    await requireAdmin();
    await setExplorerEnabledService(enabled);
    revalidatePath("/admin/reglages");
    revalidatePath("/");
    revalidatePath("/explorer");
    revalidatePath("/sitemap.xml");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible de modifier la visibilité d’Explorer." };
  }
}

export async function setMaintenanceEnabled(enabled: boolean) {
  try {
    await requireAdmin();
    await setMaintenanceEnabledService(enabled);
    revalidatePath("/admin/reglages");
    revalidatePath("/");
    revalidatePath("/maintenance");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible de modifier le mode maintenance." };
  }
}

export async function setProSubscriptionPrice(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100_000_000) {
    return { error: "Le prix doit être un montant entier compris entre 1 et 100 000 000 F." };
  }

  try {
    await requireAdmin();
    const result = await setProPriceService(amount);
    revalidatePath("/admin/reglages");
    revalidatePath("/espace/abonnement");
    return { success: true as const, amount: result.proPriceXof };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible de modifier le prix Pro." };
  }
}

export async function setProPlusSubscriptionPrice(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100_000_000) {
    return { error: "Le prix doit être un montant entier compris entre 1 et 100 000 000 F." };
  }

  try {
    await requireAdmin();
    const result = await setProPlusPriceService(amount);
    revalidatePath("/admin/reglages");
    revalidatePath("/espace/abonnement");
    return { success: true as const, amount: result.proPlusPriceXof };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible de modifier le prix Pro+." };
  }
}

export async function sendAdminAnnouncement(_prevState: AdminAnnouncementState, formData: FormData): Promise<AdminAnnouncementState> {
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const url = String(formData.get("url") || "/espace/commandes").trim();
  if (title.length < 3 || title.length > 60) return { error: "Le titre doit contenir entre 3 et 60 caractères." };
  if (body.length < 3 || body.length > 180) return { error: "Le message doit contenir entre 3 et 180 caractères." };
  if (!url.startsWith("/") || url.startsWith("//") || /\s/.test(url)) return { error: "Choisissez un lien interne valide." };

  try {
    const admin = await requireAdmin();
    const result = await sendAdminPushAnnouncement({
      title,
      body,
      url,
      sentByPhone: admin.phone || "administrateur",
    });
    revalidatePath("/admin/notifications");
    return { success: true as const, ...result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible d’envoyer la notification." };
  }
}
