import { getDb } from "@/db";
import { normalizePhone } from "@/lib/phone";
import { allowNativeAdminLogin, nativeAdminJson } from "@/lib/native-admin-api";
import { loginUser, revokeSession } from "@/services/auth.service";
import { isUserAdmin } from "@/services/admin.service";

const SESSION_SECONDS = 30 * 24 * 60 * 60;

export async function POST(request: Request) {
  let body: { phone?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return nativeAdminJson({ error: "Requête invalide." }, 400);
  }

  if (typeof body.phone !== "string" || body.phone.length > 32 || typeof body.password !== "string" || body.password.length < 1 || body.password.length > 1024) {
    return nativeAdminJson({ error: "Numéro ou mot de passe invalide." }, 400);
  }

  try {
    if (!(await allowNativeAdminLogin(request))) {
      return NextResponseTooManyAttempts();
    }

    const phone = normalizePhone(body.phone);
    if (!phone) return nativeAdminJson({ error: "Identifiants incorrects." }, 401);

    const result = await loginUser({ phone, password: body.password });
    if (!isUserAdmin(result.user.phone)) {
      try {
        await revokeSession(await getDb(), result.token);
      } catch {
        // Never return a seller session token from the admin sign-in endpoint.
      }
      return nativeAdminJson({ error: "Ce compte n’a pas accès à l’administration." }, 403);
    }

    return nativeAdminJson({
      accessToken: result.token,
      tokenType: "Bearer",
      expiresIn: SESSION_SECONDS,
      admin: { phone: result.user.phone, name: result.user.name || "Administrateur" },
    });
  } catch (error) {
    console.error("Admin iOS login error:", error);
    if (error instanceof Error && error.message === "Identifiants incorrects.") {
      return nativeAdminJson({ error: "Identifiants incorrects." }, 401);
    }
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return nativeAdminJson({ error: `Connexion indisponible (${message}). Réessaie.` }, 503);
  }
}

export async function DELETE(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer ([a-f\d]{64})$/i);
  if (!match) return nativeAdminJson({ error: "Session requise." }, 401);

  try {
    await revokeSession(await getDb(), match[1]);
    return nativeAdminJson({ success: true });
  } catch {
    return nativeAdminJson({ error: "Déconnexion indisponible. Réessaie." }, 503);
  }
}

function NextResponseTooManyAttempts() {
  const response = nativeAdminJson({ error: "Trop de tentatives. Réessaie dans 15 minutes." }, 429);
  response.headers.set("Retry-After", "900");
  return response;
}
