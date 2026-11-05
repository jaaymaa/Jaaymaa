import { NextResponse } from "next/server";
import { getAdminAnalyticsRealtime } from "@/services/admin.service";
import { getSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Cloudflare-CDN-Cache-Control": "no-store",
};

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json(
      { status: "connection_error", message: "Votre session administrateur a expiré. Reconnectez-vous." },
      { status: 401, headers: privateHeaders }
    );
  }

  try {
    const data = await getAdminAnalyticsRealtime();
    return NextResponse.json(data, { headers: privateHeaders });
  } catch {
    return NextResponse.json(
      { status: "connection_error", message: "Impossible d’actualiser les données en temps réel." },
      { status: 502, headers: privateHeaders }
    );
  }
}
