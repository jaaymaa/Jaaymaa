import { NextRequest, NextResponse } from "next/server";
import { exploreShops } from "@/services/shop.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("cat") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  try {
    const result = await exploreShops({ q, category, page, limit: 12 });
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180",
        "Cloudflare-CDN-Cache-Control": "public, max-age=60, stale-while-revalidate=180",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur explore boutiques";
    return NextResponse.json({ error: message, items: [], hasNextPage: false }, { status: 500 });
  }
}
