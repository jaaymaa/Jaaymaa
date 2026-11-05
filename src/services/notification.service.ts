import "server-only";

import { ulid } from "ulid";
import { and, eq } from "drizzle-orm";
import { getDb, adminBroadcasts, pushSubscriptions, type AppDb } from "@/db";

type PushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

type PushConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

type PushResult = { delivered: boolean; expired: boolean };

const vapidTokenCache = new Map<string, { token: string; expiresAt: number }>();

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64Url(value: string | Uint8Array): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function concatBytes(...values: Uint8Array[]): Uint8Array {
  const length = values.reduce((total, value) => total + value.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const value of values) {
    result.set(value, offset);
    offset += value.length;
  }
  return result;
}

function getPushConfig(): PushConfig | null {
  const publicKey = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const subject = (process.env.VAPID_SUBJECT || "").trim();
  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

export function isPushConfigured(): boolean {
  const config = getPushConfig();
  if (!config) return false;
  try {
    return decodeBase64Url(config.publicKey).length === 65 && decodeBase64Url(config.privateKey).length === 32;
  } catch {
    return false;
  }
}

export function getVapidPublicKey(): { publicKey: string | null } {
  return { publicKey: isPushConfigured() ? getPushConfig()?.publicKey || null : null };
}

export function isSupportedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    return [
      "fcm.googleapis.com",
      "push.services.mozilla.com",
      "push.apple.com",
      "push.icloud.com",
      "notify.windows.com",
    ].some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export async function savePushSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string,
  customDb?: AppDb
) {
  if (!isSupportedPushEndpoint(sub.endpoint)) throw new Error("Adresse de notification non prise en charge.");
  if (decodeBase64Url(sub.keys.p256dh).length !== 65 || decodeBase64Url(sub.keys.auth).length !== 16) {
    throw new Error("Clés de notification invalides.");
  }

  const db = customDb || (await getDb());
  const now = new Date();

  await db
    .insert(pushSubscriptions)
    .values({
      id: ulid(),
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: userAgent || null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: userAgent || null,
        updatedAt: now,
      },
    });

  return { success: true };
}

export async function removePushSubscription(
  userId: string,
  endpoint: string,
  customDb?: AppDb
) {
  const db = customDb || (await getDb());
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));

  return { success: true };
}

async function hmacSha256(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", toArrayBuffer(keyBytes), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, toArrayBuffer(data)));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const result = new Uint8Array(length);
  let previous: Uint8Array<ArrayBufferLike> = new Uint8Array();
  let written = 0;
  let block = 1;
  while (written < length) {
    previous = await hmacSha256(prk, concatBytes(previous, info, new Uint8Array([block])));
    const count = Math.min(previous.length, length - written);
    result.set(previous.subarray(0, count), written);
    written += count;
    block += 1;
  }
  return result;
}

async function encryptPushPayload(subscription: PushSubscription, payload: PushPayload): Promise<Uint8Array> {
  const userAgentPublic = decodeBase64Url(subscription.p256dh);
  const authSecret = decodeBase64Url(subscription.auth);
  if (userAgentPublic.length !== 65 || userAgentPublic[0] !== 4 || authSecret.length !== 16) {
    throw new Error("Invalid push subscription keys.");
  }

  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  ) as CryptoKeyPair;
  const serverPublic = new Uint8Array(await crypto.subtle.exportKey("raw", ephemeral.publicKey));
  const receiverPublicKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(userAgentPublic),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "ECDH", public: receiverPublicKey },
    ephemeral.privateKey,
    256
  ));

  const authenticationPrk = await hmacSha256(authSecret, sharedSecret);
  const keyInfo = concatBytes(
    new TextEncoder().encode("WebPush: info"),
    new Uint8Array([0]),
    userAgentPublic,
    serverPublic
  );
  const inputKeyMaterial = await hkdfExpand(authenticationPrk, keyInfo, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmacSha256(salt, inputKeyMaterial);
  const contentEncryptionKey = await hkdfExpand(prk, new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdfExpand(prk, new TextEncoder().encode("Content-Encoding: nonce\0"), 12);
  const aesKey = await crypto.subtle.importKey("raw", toArrayBuffer(contentEncryptionKey), { name: "AES-GCM" }, false, ["encrypt"]);
  const plaintext = concatBytes(new TextEncoder().encode(JSON.stringify(payload)), new Uint8Array([2]));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(nonce) }, aesKey, toArrayBuffer(plaintext)));

  const recordHeader = new Uint8Array(21);
  recordHeader.set(salt, 0);
  new DataView(recordHeader.buffer).setUint32(16, 4096, false);
  recordHeader[20] = serverPublic.length;
  return concatBytes(recordHeader, serverPublic, ciphertext);
}

async function createVapidToken(endpoint: URL, config: PushConfig): Promise<string> {
  const cacheKey = endpoint.origin;
  const cached = vapidTokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const publicBytes = decodeBase64Url(config.publicKey);
  const privateBytes = decodeBase64Url(config.privateKey);
  if (publicBytes.length !== 65 || publicBytes[0] !== 4 || privateBytes.length !== 32) {
    throw new Error("VAPID keys are invalid.");
  }

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: encodeBase64Url(publicBytes.slice(1, 33)),
    y: encodeBase64Url(publicBytes.slice(33, 65)),
    d: encodeBase64Url(privateBytes),
    ext: true,
  };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const unsignedToken = `${encodeBase64Url(JSON.stringify({ typ: "JWT", alg: "ES256" }))}.${encodeBase64Url(JSON.stringify({
    aud: endpoint.origin,
    exp: now + 12 * 60 * 60,
    sub: config.subject,
  }))}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    toArrayBuffer(new TextEncoder().encode(unsignedToken))
  );
  const token = `${unsignedToken}.${encodeBase64Url(new Uint8Array(signature))}`;
  vapidTokenCache.set(cacheKey, { token, expiresAt: (now + 12 * 60 * 60) * 1000 });
  return token;
}

async function sendPush(subscription: PushSubscription, payload: PushPayload): Promise<PushResult> {
  const config = getPushConfig();
  if (!config || !isPushConfigured()) throw new Error("Les notifications push ne sont pas configurées.");
  if (!isSupportedPushEndpoint(subscription.endpoint)) throw new Error("Adresse de notification non prise en charge.");

  const endpoint = new URL(subscription.endpoint);
  const [body, vapidToken] = await Promise.all([
    encryptPushPayload(subscription, payload),
    createVapidToken(endpoint, config),
  ]);
  const bodyArrayBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${vapidToken}, k=${config.publicKey}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "normal",
    },
    body: bodyArrayBuffer,
  });
  return { delivered: response.ok, expired: response.status === 404 || response.status === 410 };
}

async function sendForSubscriptions(
  subscriptions: PushSubscription[],
  payload: PushPayload,
  db: AppDb
): Promise<{ deliveredCount: number; failedCount: number }> {
  let deliveredCount = 0;
  let failedCount = 0;
  for (let offset = 0; offset < subscriptions.length; offset += 15) {
    const batch = subscriptions.slice(offset, offset + 15);
    const results = await Promise.all(batch.map(async (subscription) => {
      try {
        return { subscription, result: await sendPush(subscription, payload) };
      } catch {
        return { subscription, result: { delivered: false, expired: false } };
      }
    }));
    for (const { subscription, result } of results) {
      if (result.delivered) deliveredCount += 1;
      else failedCount += 1;
      if (result.expired) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, subscription.endpoint));
      }
    }
  }
  return { deliveredCount, failedCount };
}

export async function sendOrderPushNotification(sellerId: string, orderId: string): Promise<void> {
  if (!isPushConfigured()) return;

  try {
    const db = await getDb();
    const subscriptions = await db
      .select({ endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, sellerId))
      .all();
    if (subscriptions.length === 0) return;

    await sendForSubscriptions(subscriptions, {
      title: "Nouvelle commande",
      body: "Une commande vient d’arriver dans votre boutique. Ouvrez Jaaymaa pour la consulter.",
      url: `/espace/commandes/${encodeURIComponent(orderId)}`,
      tag: `jaay-order-${orderId}`,
    }, db);
  } catch {
    // Une panne push ne doit jamais annuler ni faire échouer une commande déjà créée.
  }
}

export async function sendTestPushNotification(userId: string, endpoint: string) {
  if (!isPushConfigured()) return { error: "Les notifications push ne sont pas configurées." };
  if (!isSupportedPushEndpoint(endpoint)) return { error: "Cet appareil n’est plus reconnu. Désactive puis réactive les notifications." };

  const db = await getDb();
  const subscription = await db
    .select({ endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth })
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)))
    .get();
  if (!subscription) return { error: "Cet appareil n’est plus enregistré. Désactive puis réactive les notifications." };

  try {
    const result = await sendPush(subscription, {
      title: "Notifications Jaaymaa activées",
      body: "Les alertes de commande sont prêtes sur cet appareil.",
      url: "/espace/commandes",
      tag: "jaay-test-push",
    });
    if (result.expired) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    return result.delivered ? { success: true as const } : { error: "Le service de notification n’a pas accepté l’envoi. Réactive les alertes sur cet appareil." };
  } catch {
    return { error: "Impossible d’envoyer la notification test. Vérifie la configuration des clés push." };
  }
}

export async function sendAdminPushAnnouncement(input: {
  title: string;
  body: string;
  url: string;
  sentByPhone: string;
}) {
  if (!isPushConfigured()) throw new Error("Les notifications push ne sont pas configurées sur le Worker Cloudflare.");

  const db = await getDb();
  const subscriptions = await db
    .select({ endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth })
    .from(pushSubscriptions)
    .all();
  const result = await sendForSubscriptions(subscriptions, {
    title: input.title,
    body: input.body,
    url: input.url,
    tag: `jaay-announcement-${Date.now()}`,
  }, db);

  await db.insert(adminBroadcasts).values({
    id: ulid(),
    title: input.title,
    body: input.body,
    url: input.url,
    targetCount: subscriptions.length,
    deliveredCount: result.deliveredCount,
    failedCount: result.failedCount,
    sentByPhone: input.sentByPhone,
    createdAt: new Date(),
  });

  return { targetCount: subscriptions.length, ...result };
}

