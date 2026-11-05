"use server";

import { getCurrentSellerId } from "@/lib/auth";
import {
  getVapidPublicKey as getVapidPublicKeyService,
  savePushSubscription as savePushSubscriptionService,
  removePushSubscription as removePushSubscriptionService,
  sendTestPushNotification as sendTestPushNotificationService,
} from "@/services/notification.service";

export async function getPushVapidPublicKey() {
  try {
    return getVapidPublicKeyService();
  } catch {
    return { publicKey: null };
  }
}

export async function savePushSubscription(subscription: Record<string, unknown>) {
  const sellerId = await getCurrentSellerId();
  if (!sellerId) return { error: "Votre session a expiré. Reconnectez-vous pour activer les notifications." };

  try {
    const endpoint = String(subscription.endpoint || "");
    const keys = (subscription.keys || {}) as { p256dh?: string; auth?: string };
    if (!endpoint || !keys.p256dh || !keys.auth) {
      return { error: "Souscription invalide." };
    }

    await savePushSubscriptionService(sellerId, {
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
    });
    return { success: true as const };
  } catch {
    return { error: "Impossible d’activer les notifications." };
  }
}

export async function removePushSubscription(endpoint: string) {
  const sellerId = await getCurrentSellerId();
  if (!sellerId) return { error: "Votre session a expiré. Reconnectez-vous pour modifier les notifications." };

  try {
    await removePushSubscriptionService(sellerId, endpoint);
    return { success: true as const };
  } catch {
    return { error: "Impossible de désactiver les notifications." };
  }
}

export async function sendTestPushNotification(endpoint?: string) {
  const sellerId = await getCurrentSellerId();
  if (!sellerId) return { error: "Votre session a expiré. Reconnectez-vous pour envoyer un test." };
  if (!endpoint) return { error: "Aucun appareil de notification n’est sélectionné." };

  return sendTestPushNotificationService(sellerId, endpoint);
}
