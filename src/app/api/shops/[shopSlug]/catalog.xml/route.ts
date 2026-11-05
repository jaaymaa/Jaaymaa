import { NextRequest, NextResponse } from "next/server";
import { getShopBySlug } from "@/services/shop.service";
import { getImageUrl } from "@/lib/images";
import { getRequestOrigin } from "@/lib/site-url";
import { getEffectivePlan, isPaidPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params;

  try {
    const shop = await getShopBySlug(shopSlug);
    if (!shop || !shop.isPublished) {
      return new NextResponse("Boutique introuvable ou non publiée", {
        status: 404,
      });
    }
    if (!isPaidPlan(getEffectivePlan(shop.plan, shop.planExpiresAt))) {
      return new NextResponse("Le flux catalogue est réservé aux formules Pro et Pro+.", {
        status: 403,
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const publicOrigin = await getRequestOrigin();
    const siteUrl = publicOrigin.replace(/\/$/, "");
    const shopUrl = `${siteUrl}/${shop.slug}`;

    const products = shop.products || [];

    const itemsXml = products
      .filter((p) => p.status === "ACTIVE")
      .map((p) => {
        const rawImg = p.images?.[0]?.url || p.imageUrl || null;
        let imgUrl = getImageUrl(rawImg);
        if (imgUrl && !imgUrl.startsWith("http")) {
          imgUrl = `${siteUrl}${imgUrl}`;
        }

        const productLink = `${shopUrl}?product=${encodeURIComponent(p.id)}`;
        const description = p.description || p.name;
        const availability = p.stock > 0 ? "in_stock" : "out_of_stock";

        return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title><![CDATA[${p.name}]]></g:title>
      <g:description><![CDATA[${description}]]></g:description>
      <g:link>${escapeXml(productLink)}</g:link>
      ${imgUrl ? `<g:image_link>${escapeXml(imgUrl)}</g:image_link>` : ""}
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${p.price} XOF</g:price>
      <g:brand><![CDATA[${shop.name}]]></g:brand>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title><![CDATA[${shop.name} | Catalogue Jaaymaa]]></title>
    <link>${escapeXml(shopUrl)}</link>
    <description><![CDATA[Catalogue produits de ${shop.name} sur Jaaymaa]]></description>
${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: unknown) {
    console.error("[Catalog XML Error]:", error);
    return new NextResponse("Erreur lors de la génération du catalogue", {
      status: 500,
    });
  }
}
