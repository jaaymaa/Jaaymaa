import { pbkdf2Sync, randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { ulid } from "ulid";
import { eq, and, isNull, gt, ne } from "drizzle-orm";
import { getDb, users, sessions, shops, type AppDb } from "@/db";
import { normalizePhone } from "@/lib/phone";
import type { User, Shop } from "@/types/schema";

const CURRENT_PBKDF2_ITERATIONS = 100_000;
const LEGACY_PBKDF2_ITERATIONS = 10_000;
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

// ─── HASHAGE DU MOT DE PASSE ───

export function hashPassword(password: string): string {
  const salt = Buffer.from(randomBytes(16)).toString("hex");
  const hash = Buffer.from(
    pbkdf2Sync(
      password,
      salt,
      CURRENT_PBKDF2_ITERATIONS,
      64,
      "sha512"
    )
  ).toString("hex");
  return `${salt}:${hash}:${CURRENT_PBKDF2_ITERATIONS}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const parts = storedHash.split(":");
  const salt = parts[0];
  const key = parts[1];
  if (!salt || !key) return false;

  const iterations =
    parts.length >= 3 && /^\d+$/.test(parts[2])
      ? Number(parts[2])
      : LEGACY_PBKDF2_ITERATIONS;

  try {
    const hash = pbkdf2Sync(password, salt, iterations, 64, "sha512");
    const keyBuf = Buffer.from(key, "hex");
    return hash.length === keyBuf.length && timingSafeEqual(hash, keyBuf);
  } catch {
    return false;
  }
}

// ─── HASHAGE DU TOKEN DE SESSION ───

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return Buffer.from(randomBytes(32)).toString("hex");
}

// ─── GESTION DES SESSIONS ───

export async function createSession(
  db: AppDb,
  userId: string
): Promise<{ token: string; expiresAt: Date }> {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: ulid(),
    userId,
    tokenHash,
    expiresAt,
    lastSeenAt: now,
    revokedAt: null,
    createdAt: now,
  });

  return { token: rawToken, expiresAt };
}

export async function validateSession(
  db: AppDb,
  rawToken: string
): Promise<{ user: User; shop: Shop | null } | null> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.length < 16) {
    return null;
  }

  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();

  // Chercher session active valide
  const sessionRecord = await db
    .select({
      sessionId: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now)
      )
    )
    .get();

  if (!sessionRecord) {
    return null;
  }

  // Cette date sert au suivi d’activité, pas à autoriser la session.
  // Une panne sur cette écriture facultative ne doit pas déconnecter le vendeur.
  try {
    await db
      .update(sessions)
      .set({ lastSeenAt: now })
      .where(eq(sessions.id, sessionRecord.sessionId));
  } catch {
    // La session a déjà été trouvée et vérifiée ci-dessus.
  }

  // Récupérer l'utilisateur
  const userRecord = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionRecord.userId))
    .get();

  if (!userRecord) {
    return null;
  }

  // Récupérer la boutique associée si présente
  const shopRecord = await db
    .select()
    .from(shops)
    .where(eq(shops.ownerId, userRecord.id))
    .get();

  const user: User = {
    id: userRecord.id,
    phone: userRecord.phone,
    name: userRecord.name,
  };

  const shop: Shop | null = shopRecord
    ? {
        id: shopRecord.id,
        ownerId: shopRecord.ownerId,
        sellerId: shopRecord.ownerId,
        slug: shopRecord.slug,
        name: shopRecord.name,
        headline: shopRecord.headline,
        tagline: shopRecord.headline,
        area: shopRecord.area,
        quartier: shopRecord.area,
        description: shopRecord.description,
        category: shopRecord.category,
        themeColor: shopRecord.themeColor,
        whatsapp: shopRecord.whatsapp,
        waveNumber: shopRecord.waveNumber,
        wavePaymentLink: shopRecord.wavePaymentLink,
        orangeMoneyNumber: shopRecord.orangeMoneyNumber,
        acceptsCash: Boolean(shopRecord.acceptsCash),
        deliveryFee: shopRecord.deliveryFee,
        deliveryNote: shopRecord.deliveryNote,
        logoUrl: shopRecord.logoUrl,
        logoKey: shopRecord.logoUrl,
        coverUrl: shopRecord.coverUrl,
        coverKey: shopRecord.coverUrl,
        facebookPixelId: shopRecord.facebookPixelId,
        tiktokPixelId: shopRecord.tiktokPixelId,
        rating: shopRecord.rating,
        featured: Boolean(shopRecord.featured),
        plan: shopRecord.plan,
        planExpiresAt: shopRecord.planExpiresAt,
        status: shopRecord.status as "DRAFT" | "ACTIVE" | "SUSPENDED",
        isPublished: shopRecord.status === "ACTIVE",
        isSuspended: shopRecord.status === "SUSPENDED",
        createdAt: shopRecord.createdAt,
        updatedAt: shopRecord.updatedAt,
      }
    : null;

  return { user, shop };
}

export async function revokeSession(db: AppDb, rawToken: string): Promise<void> {
  if (!rawToken) return;
  const tokenHash = hashSessionToken(rawToken);
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, tokenHash));
}

/** Change a user's password and invalidate every other active session. */
export async function changeUserPassword(
  db: AppDb,
  userId: string,
  currentPassword: string,
  newPassword: string,
  currentSessionToken: string
): Promise<boolean> {
  const userRecord = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!userRecord?.passwordHash || !verifyPassword(currentPassword, userRecord.passwordHash)) {
    return false;
  }

  const now = new Date();
  await db
    .update(users)
    .set({ passwordHash: hashPassword(newPassword), updatedAt: now })
    .where(eq(users.id, userId));

  const currentTokenHash = hashSessionToken(currentSessionToken);
  await db
    .update(sessions)
    .set({ revokedAt: now })
    .where(
      and(
        eq(sessions.userId, userId),
        isNull(sessions.revokedAt),
        ne(sessions.tokenHash, currentTokenHash)
      )
    );

  return true;
}

// ─── INSCRIPTION ET CONNEXION ───

export async function registerUser(
  data: { phone: string; password: string; name?: string },
  customDb?: AppDb
): Promise<{ user: User; shop: Shop | null; token: string }> {
  const db = customDb || (await getDb());
  const phone = normalizePhone(data.phone);
  if (!phone) {
    throw new Error("Numéro de téléphone sénégalais invalide.");
  }

  if (!data.password || data.password.length < 6) {
    throw new Error("Le mot de passe doit comporter au moins 6 caractères.");
  }

  // Vérifier si le téléphone est déjà utilisé
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, phone))
    .get();

  if (existingUser) {
    throw new Error("Ce numéro de téléphone est déjà associé à un compte.");
  }

  const userId = ulid();
  const passwordHash = hashPassword(data.password);
  const now = new Date();

  await db.insert(users).values({
    id: userId,
    phone,
    name: data.name?.trim() || "Vendeur",
    passwordHash,
    role: "seller",
    createdAt: now,
    updatedAt: now,
  });

  const { token } = await createSession(db, userId);

  return {
    user: { id: userId, phone, name: data.name?.trim() || "Vendeur" },
    shop: null,
    token,
  };
}

export async function loginUser(
  data: { phone: string; password: string },
  customDb?: AppDb
): Promise<{ user: User; shop: Shop | null; token: string }> {
  const db = customDb || (await getDb());
  const phone = normalizePhone(data.phone);
  if (!phone) {
    throw new Error("Identifiants incorrects.");
  }

  const userRecord = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .get();

  // Ne pas révéler si le compte existe (timing & message générique)
  if (!userRecord || !userRecord.passwordHash) {
    throw new Error("Identifiants incorrects.");
  }

  const isValid = verifyPassword(data.password, userRecord.passwordHash);
  if (!isValid) {
    throw new Error("Identifiants incorrects.");
  }

  // Récupérer la boutique
  const shopRecord = await db
    .select()
    .from(shops)
    .where(eq(shops.ownerId, userRecord.id))
    .get();

  const { token } = await createSession(db, userRecord.id);

  const shop: Shop | null = shopRecord
    ? {
        id: shopRecord.id,
        ownerId: shopRecord.ownerId,
        sellerId: shopRecord.ownerId,
        slug: shopRecord.slug,
        name: shopRecord.name,
        headline: shopRecord.headline,
        tagline: shopRecord.headline,
        area: shopRecord.area,
        quartier: shopRecord.area,
        description: shopRecord.description,
        category: shopRecord.category,
        themeColor: shopRecord.themeColor,
        whatsapp: shopRecord.whatsapp,
        waveNumber: shopRecord.waveNumber,
        wavePaymentLink: shopRecord.wavePaymentLink,
        orangeMoneyNumber: shopRecord.orangeMoneyNumber,
        acceptsCash: Boolean(shopRecord.acceptsCash),
        deliveryFee: shopRecord.deliveryFee,
        deliveryNote: shopRecord.deliveryNote,
        logoUrl: shopRecord.logoUrl,
        logoKey: shopRecord.logoUrl,
        coverUrl: shopRecord.coverUrl,
        coverKey: shopRecord.coverUrl,
        facebookPixelId: shopRecord.facebookPixelId,
        tiktokPixelId: shopRecord.tiktokPixelId,
        rating: shopRecord.rating,
        featured: Boolean(shopRecord.featured),
        plan: shopRecord.plan,
        planExpiresAt: shopRecord.planExpiresAt,
        status: shopRecord.status as "DRAFT" | "ACTIVE" | "SUSPENDED",
        isPublished: shopRecord.status === "ACTIVE",
        isSuspended: shopRecord.status === "SUSPENDED",
        createdAt: shopRecord.createdAt,
        updatedAt: shopRecord.updatedAt,
      }
    : null;

  return {
    user: {
      id: userRecord.id,
      phone: userRecord.phone,
      name: userRecord.name,
    },
    shop,
    token,
  };
}
