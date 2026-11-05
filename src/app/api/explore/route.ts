import { NextRequest, NextResponse } from "next/server";
import { exploreProducts } from "@/services/product.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const cat = searchParams.get("cat") || "";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  try {
    const res = await exploreProducts({
      q,
      category: cat === "Tous" ? "" : cat,
      page,
      limit: 20,
    });

    return NextResponse.json(res, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180",
        "Cloudflare-CDN-Cache-Control": "public, max-age=60, stale-while-revalidate=180",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur explore";
    return NextResponse.json({ error: msg, items: [], hasNextPage: false }, { status: 500 });
  }
}
