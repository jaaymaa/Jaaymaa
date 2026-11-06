import { revalidatePath } from "next/cache";
import { getImageUrl } from "@/lib/images";
import { nativeAdminJson, requireNativeAdmin } from "@/lib/native-admin-api";
import {
  adminUpdateShopPlan,
  adminUpdateShopStatus,
  getAdminAccounts,
  getAdminAnalytics,
  getAdminNotificationHistory,
  getAdminOrders,
  getAdminOverview,
  getAdminSettings,
  getAdminShops,
  getAdminSubscriptions,
  setExplorerEnabled,
  setMaintenanceEnabled,
  setProPlusPrice,
  setProPrice,
} from "@/services/admin.service";
import { sendAdminPushAnnouncement } from "@/services/notification.service";

type RouteContext = { params: Promise<{ section: string }> };

function absoluteImageUrl(image: string | null | undefined, origin: string): string | null {
  if (!image) return null;
  return new URL(getImageUrl(image) || image, origin).toString();
}

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await requireNativeAdmin(request);
  if (!auth.ok) return auth.response;

  const { section } = await params;
  const url = new URL(request.url);
  const page = boundedInteger(url.searchParams.get("page"), 1, 1, 10_000);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);

  try {
    switch (section) {
      case "overview":
        return nativeAdminJson(await getAdminOverview());
      case "shops":
        {
          const result = await getAdminShops({
            q,
            status: boundedEnum(url.searchParams.get("status"), ["ACTIVE", "DRAFT", "SUSPENDED"]),
            plan: boundedEnum(url.searchParams.get("plan"), ["free", "pro", "pro_plus", "expired"]),
            page,
          });
          return nativeAdminJson({
            ...result,
            items: result.items.map((shop) => ({
              ...shop,
              logoUrl: absoluteImageUrl(shop.logoUrl, url.origin),
            })),
          });
        }
      case "accounts":
        return nativeAdminJson(await getAdminAccounts({
          q,
          hasShop: boundedEnum(url.searchParams.get("hasShop"), ["true", "false"]),
          page,
        }));
      case "orders":
        return nativeAdminJson(await getAdminOrders({
          q,
          status: boundedEnum(url.searchParams.get("status"), ["NEW", "CONFIRMED", "PAID", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
          payment: boundedEnum(url.searchParams.get("payment"), ["paid", "pending"]),
          page,
        }));
      case "subscriptions":
        {
          const result = await getAdminSubscriptions({
            q,
            plan: boundedEnum(url.searchParams.get("plan"), ["all", "pro", "pro_plus", "expired"]),
            page,
          });
          return nativeAdminJson({
            ...result,
            shops: {
              ...result.shops,
              items: result.shops.items.map((shop) => ({
                ...shop,
                logoUrl: absoluteImageUrl(shop.logoUrl, url.origin),
              })),
            },
          });
        }
      case "analytics": {
        const requestedDays = Number(url.searchParams.get("days"));
        const days = ([7, 28, 90, 365].includes(requestedDays) ? requestedDays : 28) as 7 | 28 | 90 | 365;
        return nativeAdminJson(await getAdminAnalytics(days));
      }
      case "notifications": {
        const [history, settings] = await Promise.all([
          getAdminNotificationHistory(page),
          getAdminSettings(),
        ]);
        return nativeAdminJson({ history, subscriberCount: settings.pushSubscriptions, pushConfigured: settings.push.configured });
      }
      case "settings": {
        const settings = await getAdminSettings();
        return nativeAdminJson({
          databaseConnected: settings.databaseConnected,
          adminCount: settings.admins.length,
          pushSubscriptions: settings.pushSubscriptions,
          pushConfigured: settings.push.configured,
          explorerEnabled: settings.explorerEnabled,
          maintenanceEnabled: settings.maintenanceEnabled,
          proPriceXof: settings.proPriceXof,
          proPlusPriceXof: settings.proPlusPriceXof,
        });
      }
      default:
        return nativeAdminJson({ error: "Section introuvable." }, 404);
    }
  } catch {
    return nativeAdminJson({ error: "Impossible de charger ces données pour le moment." }, 503);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireNativeAdmin(request);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return nativeAdminJson({ error: "Requête invalide." }, 400);
  }

  const { section } = await params;
  try {
    if (section === "shops" || section === "subscriptions") {
      const shopId = typeof body.shopId === "string" ? body.shopId.slice(0, 64) : "";
      if (!shopId) return nativeAdminJson({ error: "Boutique invalide." }, 400);

      if (body.plan !== undefined) {
        if (body.plan !== "free" && body.plan !== "pro" && body.plan !== "pro_plus") {
          return nativeAdminJson({ error: "Formule invalide." }, 400);
        }
        await adminUpdateShopPlan(shopId, body.plan, body.plan === "free" ? 0 : 30);
        revalidatePath("/admin/boutiques");
        revalidatePath("/admin/abonnements");
        revalidatePath("/espace/abonnement");
        return nativeAdminJson({ success: true });
      }

      if (section === "shops" && (body.status === "ACTIVE" || body.status === "DRAFT" || body.status === "SUSPENDED")) {
        await adminUpdateShopStatus(shopId, body.status);
        revalidatePath("/admin/boutiques");
        revalidatePath("/explorer");
        return nativeAdminJson({ success: true });
      }
      return nativeAdminJson({ error: "Modification invalide." }, 400);
    }

    if (section === "settings") {
      let changed = false;
      if (typeof body.explorerEnabled === "boolean") {
        await setExplorerEnabled(body.explorerEnabled);
        revalidatePath("/");
        revalidatePath("/explorer");
        changed = true;
      }
      if (typeof body.maintenanceEnabled === "boolean") {
        await setMaintenanceEnabled(body.maintenanceEnabled);
        revalidatePath("/");
        revalidatePath("/maintenance");
        changed = true;
      }
      if (typeof body.proPriceXof === "number" && Number.isSafeInteger(body.proPriceXof) && body.proPriceXof >= 1 && body.proPriceXof <= 100_000_000) {
        await setProPrice(body.proPriceXof);
        revalidatePath("/espace/abonnement");
        changed = true;
      }
      if (typeof body.proPlusPriceXof === "number" && Number.isSafeInteger(body.proPlusPriceXof) && body.proPlusPriceXof >= 1 && body.proPlusPriceXof <= 100_000_000) {
        await setProPlusPrice(body.proPlusPriceXof);
        revalidatePath("/espace/abonnement");
        changed = true;
      }
      return changed
        ? nativeAdminJson({ success: true })
        : nativeAdminJson({ error: "Aucun réglage valide à enregistrer." }, 400);
    }
  } catch {
    return nativeAdminJson({ error: "La modification n’a pas pu être enregistrée." }, 503);
  }

  return nativeAdminJson({ error: "Modification non disponible." }, 404);
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireNativeAdmin(request);
  if (!auth.ok) return auth.response;
  const { section } = await params;
  if (section !== "notifications") return nativeAdminJson({ error: "Action non disponible." }, 404);

  let body: { title?: unknown; body?: unknown; url?: unknown };
  try {
    body = await request.json();
  } catch {
    return nativeAdminJson({ error: "Requête invalide." }, 400);
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.body === "string" ? body.body.trim() : "";
  const targetUrl = typeof body.url === "string" ? body.url.trim() : "/espace/commandes";
  if (title.length < 3 || title.length > 60 || message.length < 3 || message.length > 180) {
    return nativeAdminJson({ error: "Le titre et le message ne respectent pas les limites autorisées." }, 400);
  }
  if (!targetUrl.startsWith("/") || targetUrl.startsWith("//") || /\s/.test(targetUrl) || targetUrl.length > 160) {
    return nativeAdminJson({ error: "Lien interne invalide." }, 400);
  }

  try {
    const result = await sendAdminPushAnnouncement({ title, body: message, url: targetUrl, sentByPhone: auth.identity.phone });
    revalidatePath("/admin/notifications");
    return nativeAdminJson({ success: true, ...result });
  } catch {
    return nativeAdminJson({ error: "La notification n’a pas pu être envoyée." }, 503);
  }
}

function boundedInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function boundedEnum<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && allowed.includes(value as T) ? value as T : undefined;
}
