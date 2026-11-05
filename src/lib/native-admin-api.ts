import { createHash } from "node:crypto";
import { eq, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { adminMobileLoginAttempts, getDb } from "@/db";
import { validateSession } from "@/services/auth.service";
import { isUserAdmin } from "@/services/admin.service";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 8;

export type NativeAdminIdentity = {
  token: string;
  phone: string;
};

export function nativeAdminJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

/** Store only a hash of the client IP and cap password attempts over a rolling window. */
export async function allowNativeAdminLogin(request: Request): Promise<boolean> {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
  const id = createHash("sha256").update(ip).digest("hex");
  const db = await getDb();
  const now = new Date();
  const cutoff = new Date(now.getTime() - LOGIN_WINDOW_MS);
  const current = await db
    .select({ attempts: adminMobileLoginAttempts.attempts, windowStartedAt: adminMobileLoginAttempts.windowStartedAt })
    .from(adminMobileLoginAttempts)
    .where(eq(adminMobileLoginAttempts.id, id))
    .get();

  if (current && current.windowStartedAt > cutoff && current.attempts >= LOGIN_ATTEMPT_LIMIT) {
    return false;
  }

  await db
    .insert(adminMobileLoginAttempts)
    .values({ id, windowStartedAt: now, attempts: 1 })
    .onConflictDoUpdate({
      target: adminMobileLoginAttempts.id,
      set: {
        attempts: sql`CASE WHEN ${adminMobileLoginAttempts.windowStartedAt} <= ${cutoff} THEN 1 ELSE ${adminMobileLoginAttempts.attempts} + 1 END`,
        windowStartedAt: sql`CASE WHEN ${adminMobileLoginAttempts.windowStartedAt} <= ${cutoff} THEN ${now} ELSE ${adminMobileLoginAttempts.windowStartedAt} END`,
      },
    });

  const updated = await db
    .select({ attempts: adminMobileLoginAttempts.attempts })
    .from(adminMobileLoginAttempts)
    .where(eq(adminMobileLoginAttempts.id, id))
    .get();

  // Prune expired IP hashes occasionally so this table stays small.
  if (Math.random() < 0.02) {
    await db
      .delete(adminMobileLoginAttempts)
      .where(lt(adminMobileLoginAttempts.windowStartedAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)));
  }

  return (updated?.attempts ?? LOGIN_ATTEMPT_LIMIT + 1) <= LOGIN_ATTEMPT_LIMIT;
}

export async function requireNativeAdmin(request: Request): Promise<
  | { ok: true; identity: NativeAdminIdentity }
  | { ok: false; response: NextResponse }
> {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer ([a-f\d]{64})$/i);
  if (!match) {
    return { ok: false, response: nativeAdminJson({ error: "Session requise." }, 401) };
  }

  try {
    const token = match[1];
    const db = await getDb();
    const session = await validateSession(db, token);
    if (!session) {
      return { ok: false, response: nativeAdminJson({ error: "Session expirée. Reconnecte-toi." }, 401) };
    }
    if (!isUserAdmin(session.user.phone)) {
      return { ok: false, response: nativeAdminJson({ error: "Accès administrateur refusé." }, 403) };
    }
    return { ok: true, identity: { token, phone: session.user.phone } };
  } catch {
    return { ok: false, response: nativeAdminJson({ error: "Service temporairement indisponible." }, 503) };
  }
}
