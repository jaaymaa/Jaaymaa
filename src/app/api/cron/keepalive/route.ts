import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Route conservée pour compatibilité sans dépendance externe.
 * Le backend externe a été remplacé par Cloudflare D1 local.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Jaayma fonctionne en mode autonome sur Cloudflare Workers et D1.",
    timestamp: new Date().toISOString(),
  });
}
