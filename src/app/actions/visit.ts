"use server";

import { cookies } from "next/headers";

/**
 * Records a shop visit once per visitor per day (Africa/Dakar timezone).
 * Uses a cookie to avoid redundant analytics writes.
 */
export async function recordShopVisit(shopId: string) {
  if (!shopId) return;

  try {
    const today = new Intl.DateTimeFormat("fr-CA", {
      timeZone: "Africa/Dakar",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const cookieStore = await cookies();
    const cookieKey = `jv_${shopId}_${today}`;

    if (cookieStore.get(cookieKey)) {
      return;
    }

    cookieStore.set(cookieKey, "1", {
      maxAge: 86400,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  } catch (err) {
    console.error("Failed to track shop visit:", err);
  }
}
