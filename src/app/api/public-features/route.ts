import { NextResponse } from "next/server";
import { getPublicFeatures } from "@/services/admin.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const features = await getPublicFeatures();
    return NextResponse.json(features, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Cloudflare-CDN-Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { explorerEnabled: true, maintenanceEnabled: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}

