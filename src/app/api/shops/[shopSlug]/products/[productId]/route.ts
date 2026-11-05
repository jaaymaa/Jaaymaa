import { NextRequest, NextResponse } from "next/server";
import { getPublicProductByShopSlug } from "@/services/product.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shopSlug: string; productId: string }> }
) {
  const { shopSlug, productId } = await params;
  try {
    const product = await getPublicProductByShopSlug(shopSlug, productId);
    if (!product) {
      return new NextResponse("Produit introuvable", { status: 404 });
    }
    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        "Cloudflare-CDN-Cache-Control": "public, max-age=120, stale-while-revalidate=300",
      },
    });
  } catch {
    return new NextResponse("Erreur serveur", { status: 500 });
  }
}

