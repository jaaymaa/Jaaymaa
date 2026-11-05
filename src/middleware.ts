import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "jaay_session";

async function isMaintenanceEnabled(request: NextRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const origin = request.nextUrl.origin;
    const response = await fetch(`${origin}/api/public-features`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return false;

    const features = (await response.json()) as { maintenanceEnabled?: unknown };
    return features.maintenanceEnabled === true;
  } catch {
    // Si la vérification échoue, on ne bloque pas le site public
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Product details now open in the shop catalog modal, so old shared URLs return to the shop.
  const productDetailMatch = pathname.match(/^\/([^/.]+)\/produit\/[^/]+\/?$/);
  if (productDetailMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/${productDetailMatch[1]}`;
    return NextResponse.redirect(url, 307);
  }

  // Protect the /espace and /admin routes and all sub-routes
  if (pathname.startsWith("/espace") || pathname.startsWith("/admin")) {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

    if (!sessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      return NextResponse.redirect(url);
    }
  }

  // Registration stays convenient for active sessions. /connexion is checked against
  // D1 by its server page, so a stale cookie cannot create a redirect loop here.
  if (pathname === "/inscription") {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

    if (sessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/espace";
      return NextResponse.redirect(url);
    }
  }

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isNativeAdminApi = pathname === "/api/admin/ios" || pathname.startsWith("/api/admin/ios/");
  const isMaintenanceExempt =
    isAdminPath ||
    isNativeAdminApi ||
    pathname === "/connexion" ||
    pathname === "/maintenance" ||
    pathname === "/api/cron/keepalive" ||
    pathname === "/api/public-features" ||
    pathname === "/api/health" ||
    pathname === "/api/admin/analytics/realtime";

  if (!isMaintenanceExempt && (await isMaintenanceEnabled(request))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Le site est temporairement en maintenance." },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store, max-age=0",
            "Cloudflare-CDN-Cache-Control": "no-store",
            "Retry-After": "60",
          },
        }
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    url.search = "";
    return NextResponse.rewrite(url, {
      status: 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Cloudflare-CDN-Cache-Control": "no-store",
        "Retry-After": "60",
      },
    });
  }

  const response = NextResponse.next();

  // En-têtes de sécurité de base pour toutes les réponses frontend
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0] || "";
  const isPublicShopPage =
    /^\/[^/.]+$/.test(pathname) &&
    !["espace", "admin", "connexion", "inscription", "api", "_next"].includes(firstSegment);

  // Product catalog and shop pages are public. A short edge TTL absorbs repeat
  // visits without caching authenticated seller pages or delaying edits for long.
  if (request.method === "GET" && (pathname === "/explorer" || isPublicShopPage)) {
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    response.headers.set(
      "Cloudflare-CDN-Cache-Control",
      "public, max-age=30, stale-while-revalidate=120, stale-if-error=86400"
    );
  }

  return response;
}

export const config = {
  // Keep framework assets and static files out of the page gate.
  matcher: [
    "/((?!_next/|favicon.ico|icons/|manifest.webmanifest|sw.js|offline.html|robots.txt|sitemap.xml).*)",
  ],
};
