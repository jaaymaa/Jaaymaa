import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";

async function getEdgeImageCache(request: NextRequest) {
  try {
    const { ctx } = await getCloudflareContext({ async: true });
    const cache = (globalThis as typeof globalThis & {
      caches?: { default?: Cache };
    }).caches?.default;
    if (!cache) return null;

    const cacheUrl = new URL(request.url);
    cacheUrl.search = "";
    return { cache, cacheKey: new Request(cacheUrl), ctx };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keyParts } = await params;
    const key = keyParts.join("/");
    if (!key || keyParts.some((part) => part === "." || part === "..")) {
      return new NextResponse("Image introuvable", { status: 404 });
    }

    const rangeHeader = request.headers.get("range");

    // Only use edge cache for non-range requests
    if (!rangeHeader) {
      const edgeCache = await getEdgeImageCache(request);
      if (edgeCache) {
        try {
          const cached = await edgeCache.cache.match(edgeCache.cacheKey);
          if (cached) {
            return new NextResponse(cached.body, {
              status: cached.status,
              statusText: cached.statusText,
              headers: cached.headers,
            });
          }
        } catch {
          // Cache miss
        }
      }
    }

    const { env } = await getCloudflareContext({ async: true });
    const mediaBucket = (env as { MEDIA_BUCKET?: R2Bucket }).MEDIA_BUCKET;

    if (!mediaBucket) {
      return new NextResponse("Stockage média indisponible", { status: 503 });
    }

    const object = await mediaBucket.get(
      key,
      rangeHeader ? { range: request.headers } : undefined
    );
    if (!object) {
      return new NextResponse("Média introuvable", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers as unknown as Headers);
    headers.set("etag", object.httpEtag);
    headers.set("accept-ranges", "bytes");

    if (!headers.has("content-type")) {
      const ext = key.split(".").pop()?.toLowerCase();
      const mime =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : ext === "avif"
              ? "image/avif"
              : ext === "mp4"
                ? "video/mp4"
                : ext === "webm"
                  ? "video/webm"
                  : ext === "mov"
                    ? "video/quicktime"
                    : "image/jpeg";
      headers.set("content-type", mime);
    }
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("Cloudflare-CDN-Cache-Control", "public, max-age=31536000, immutable");

    const isRange = Boolean(rangeHeader && "range" in object && object.range);
    const status = isRange ? 206 : 200;
    if (isRange && "range" in object && object.range) {
      const r = object.range as { offset: number; length: number };
      headers.set("content-range", `bytes ${r.offset}-${r.offset + r.length - 1}/${object.size}`);
      headers.set("content-length", String(r.length));
    }

    const response = new NextResponse(object.body as unknown as BodyInit, {
      status,
      headers,
    });

    if (!rangeHeader) {
      const edgeCache = await getEdgeImageCache(request);
      if (edgeCache) {
        try {
          edgeCache.ctx.waitUntil(
            edgeCache.cache.put(edgeCache.cacheKey, response.clone()).catch(() => undefined)
          );
        } catch {
          // Ignorer si cache put échoue
        }
      }
    }

    return response;
  } catch (error) {
    console.error("Erreur de récupération d'image R2:", error);
    return new NextResponse("Erreur serveur", { status: 500 });
  }
}
