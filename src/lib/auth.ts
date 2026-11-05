import { cookies } from "next/headers";
import { cache } from "react";
import { getDb } from "@/db";
import { validateSession, revokeSession } from "@/services/auth.service";
import type { Shop } from "@/types/schema";

const SESSION_COOKIE = "jaay_session";
const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 jours

/** Renvoie le token opaque brut stocké dans le cookie. */
export const getSessionToken = cache(async (): Promise<string | null> => {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
});

type SellerContext = {
  sellerId: string;
  phone: string;
  name?: string;
  shop: Shop | null;
};

/** Vérifie la session dans D1. Les erreurs d’infrastructure restent visibles aux pages. */
export const getCurrentSellerContextStrict = cache(async (): Promise<SellerContext | null> => {
  const token = await getSessionToken();
  if (!token) return null;

  const db = await getDb();
  const result = await validateSession(db, token);
  if (!result || !result.user) return null;

  return {
    sellerId: result.user.id,
    phone: result.user.phone,
    name: result.user.name,
    shop: result.shop,
  };
});

/** Renvoie le contexte du vendeur, ou null si la session ne peut pas être vérifiée. */
export const getCurrentSellerContext = cache(async (): Promise<SellerContext | null> => {
  try {
    return await getCurrentSellerContextStrict();
  } catch {
    // Les actions et pages publiques gardent un résultat sûr si D1 est momentanément indisponible.
    return null;
  }
});

/** Renvoie l'ID du vendeur de la session courante ou null. */
export const getCurrentSellerId = cache(async (): Promise<string | null> => {
  const ctx = await getCurrentSellerContext();
  return ctx ? ctx.sellerId : null;
});

/** Définit le cookie de session sécurisé HttpOnly. */
export async function setSessionCookie(rawToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

/** Supprime le cookie de session et révoque la session en D1. */
export async function clearSessionCookie(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    try {
      const db = await getDb();
      await revokeSession(db, token);
    } catch {
      // Ignorer si la base est temporairement inaccessible
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
