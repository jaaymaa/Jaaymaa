import { ulid } from "ulid";
import { eq, and, desc, like, or, sql, gte, isNull } from "drizzle-orm";
import { getDb, getRoutingKV, shops, products, productImages, type AppDb } from "@/db";
import type { Shop, Product, ProductImage } from "@/types/schema";
import { getImageUrl } from "@/lib/images";
import { getEffectivePlan, getPhotoLimit } from "@/lib/plans";

function activeProPlusPriority() {
  return sql<number>`CASE WHEN ${and(
    eq(shops.plan, "pro_plus"),
    or(isNull(shops.planExpiresAt), gte(shops.planExpiresAt, new Date()))
  )} THEN 1 ELSE 0 END`;
}

export async function invalidateShopKvCache(slugOrId: string) {
  try {
    const kv = await getRoutingKV();
    if (!kv) return;
    await kv.delete(`shop:${slugOrId.toLowerCase()}`);
  } catch {
    // Ignorer si indisponible
  }
}

export function normalizeShopRecord(
  s: typeof shops.$inferSelect,
  shopProducts: Product[] = []
): Shop {
  return {
    id: s.id,
    ownerId: s.ownerId,
    sellerId: s.ownerId,
    slug: s.slug,
    name: s.name,
    headline: s.headline,
    tagline: s.headline,
    area: s.area,
    quartier: s.area,
    description: s.description,
    category: s.category,
    themeColor: s.themeColor,
    whatsapp: s.whatsapp,
    waveNumber: s.waveNumber,
    wavePaymentLink: s.wavePaymentLink,
    orangeMoneyNumber: s.orangeMoneyNumber,
    acceptsCash: Boolean(s.acceptsCash),
    deliveryFee: s.deliveryFee,
    deliveryNote: s.deliveryNote,
    logoUrl: s.logoUrl,
    logoKey: s.logoUrl,
    coverUrl: s.coverUrl,
    coverKey: s.coverUrl,
    facebookPixelId: s.facebookPixelId,
    tiktokPixelId: s.tiktokPixelId,
    rating: s.rating,
    featured: Boolean(s.featured),
    plan: s.plan,
    planExpiresAt: s.planExpiresAt,
    status: s.status as "DRAFT" | "ACTIVE" | "SUSPENDED",
    isPublished: s.status === "ACTIVE",
    isSuspended: s.status === "SUSPENDED",
    products: shopProducts,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export async function getShopBySlug(
  slug: string,
  customDb?: AppDb
): Promise<Shop | null> {
  const normalizedSlug = slug.toLowerCase();
  const cacheKey = `shop:${normalizedSlug}`;
  let kv = null;

  if (!customDb) {
    try {
      kv = await getRoutingKV();
      if (kv) {
        const cached = await kv.get(cacheKey, "json");
        if (cached) return cached as Shop;
      }
    } catch {
      // Ignorer si cache miss ou erreur
    }
  }

  const db = customDb || (await getDb());
  const shopRecord = await db
    .select()
    .from(shops)
    .where(eq(shops.slug, slug))
    .get();

  if (!shopRecord) return null;

  // Récupérer les produits actifs
  const activeProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.shopId, shopRecord.id), eq(products.status, "ACTIVE")))
    .orderBy(products.position, desc(products.createdAt))
    .all();

  const productIds = activeProducts.map((p) => p.id);
  let allImages: (typeof productImages.$inferSelect)[] = [];

  if (productIds.length > 0) {
    allImages = await db
      .select()
      .from(productImages)
      .where(sql`${productImages.productId} IN ${productIds}`)
      .orderBy(productImages.position)
      .all();
  }

  const imagesByProduct = new Map<string, ProductImage[]>();
  for (const img of allImages) {
    const list = imagesByProduct.get(img.productId) || [];
    list.push({
      id: img.id,
      productId: img.productId,
      url: img.url,
      alt: img.alt,
      position: img.position,
    });
    imagesByProduct.set(img.productId, list);
  }

  const photoLimit = getPhotoLimit(getEffectivePlan(shopRecord.plan, shopRecord.planExpiresAt));
  const mappedProducts: Product[] = activeProducts.map((p) => {
    const imgs = (imagesByProduct.get(p.id) || []).slice(0, photoLimit);
    const imageUrls = imgs
      .map((i) => getImageUrl(i.url))
      .filter((u): u is string => Boolean(u));

    return {
      id: p.id,
      shopId: p.shopId,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      position: p.position,
      status: p.status as "DRAFT" | "ACTIVE" | "ARCHIVED",
      isActive: p.status === "ACTIVE",
      images: imgs,
      imageUrl: imageUrls[0] ?? null,
      imageUrls,
      optionsJson: p.optionsJson,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  const shopResult = normalizeShopRecord(shopRecord, mappedProducts);

  if (kv && !customDb) {
    try {
      await kv.put(cacheKey, JSON.stringify(shopResult), { expirationTtl: 120 });
    } catch {
      // Ignorer si échec d'écriture KV
    }
  }

  return shopResult;
}

export async function getShopById(
  id: string,
  customDb?: AppDb
): Promise<Shop | null> {
  const db = customDb || (await getDb());
  const shopRecord = await db.select().from(shops).where(eq(shops.id, id)).get();
  return shopRecord ? normalizeShopRecord(shopRecord) : null;
}

export async function getShopByOwner(
  ownerId: string,
  customDb?: AppDb
): Promise<Shop | null> {
  const db = customDb || (await getDb());
  const shopRecord = await db
    .select()
    .from(shops)
    .where(eq(shops.ownerId, ownerId))
    .get();

  return shopRecord ? normalizeShopRecord(shopRecord) : null;
}

export async function listPublicShops(
  params?: { q?: string; category?: string },
  customDb?: AppDb
): Promise<Shop[]> {
  const db = customDb || (await getDb());
  const conditions = [eq(shops.status, "ACTIVE")];

  if (params?.q) {
    const term = `%${params.q.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${shops.name})`, term),
        like(sql`lower(${shops.description})`, term),
        like(sql`lower(${shops.area})`, term)
      )!
    );
  }

  if (params?.category && params.category !== "Tous") {
    conditions.push(eq(shops.category, params.category));
  }

  const records = await db
    .select()
    .from(shops)
    .where(and(...conditions))
    .orderBy(desc(activeProPlusPriority()), desc(shops.featured), desc(shops.createdAt))
    .all();

  return records.map((s) => normalizeShopRecord(s));
}

export async function exploreShops(
  params?: { q?: string; category?: string; page?: number; limit?: number },
  customDb?: AppDb
): Promise<{ items: Shop[]; hasNextPage: boolean }> {
  const db = customDb || (await getDb());
  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, Math.min(50, params?.limit || 12));
  const offset = (page - 1) * limit;

  const conditions = [eq(shops.status, "ACTIVE")];

  if (params?.q) {
    const term = `%${params.q.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${shops.name})`, term),
        like(sql`lower(${shops.description})`, term),
        like(sql`lower(${shops.area})`, term)
      )!
    );
  }

  if (params?.category && params.category !== "Tous") {
    conditions.push(eq(shops.category, params.category));
  }

  const records = await db
    .select()
    .from(shops)
    .where(and(...conditions))
    .orderBy(desc(activeProPlusPriority()), desc(shops.featured), desc(shops.createdAt))
    .limit(limit + 1)
    .offset(offset)
    .all();

  const hasNextPage = records.length > limit;
  const items = records.slice(0, limit).map((s) => normalizeShopRecord(s));

  return { items, hasNextPage };
}

export async function createShop(
  data: Record<string, unknown>,
  ownerId: string,
  customDb?: AppDb
): Promise<Shop> {
  const db = customDb || (await getDb());
  const id = ulid();
  const now = new Date();

  const newShopData = {
    id,
    ownerId,
    slug: String(data.slug),
    name: String(data.name),
    headline: typeof data.headline === "string" ? data.headline : "",
    area: typeof data.area === "string" ? data.area : "",
    description: typeof data.description === "string" ? data.description : "",
    category: typeof data.category === "string" ? data.category : null,
    themeColor: typeof data.themeColor === "string" ? data.themeColor : "#C8265A",
    whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : null,
    waveNumber: typeof data.waveNumber === "string" ? data.waveNumber : null,
    wavePaymentLink: typeof data.wavePaymentLink === "string" ? data.wavePaymentLink : null,
    orangeMoneyNumber: typeof data.orangeMoneyNumber === "string" ? data.orangeMoneyNumber : null,
    acceptsCash: data.acceptsCash !== false,
    deliveryFee: typeof data.deliveryFee === "number" ? Math.max(0, Math.floor(data.deliveryFee)) : 0,
    deliveryNote: typeof data.deliveryNote === "string" ? data.deliveryNote : null,
    logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : null,
    coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : null,
    facebookPixelId: typeof data.facebookPixelId === "string" ? data.facebookPixelId : null,
    tiktokPixelId: typeof data.tiktokPixelId === "string" ? data.tiktokPixelId : null,
    status: (data.status as "DRAFT" | "ACTIVE" | "SUSPENDED") || "ACTIVE",
    plan: "free",
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(shops).values(newShopData);
  const created = await db.select().from(shops).where(eq(shops.id, id)).get();
  if (!created) throw new Error("Impossible de créer la boutique.");
  return normalizeShopRecord(created);
}

export async function updateShop(
  shopId: string,
  data: Record<string, unknown>,
  sellerId: string,
  customDb?: AppDb
): Promise<Shop> {
  const db = customDb || (await getDb());

  // Vérification stricte d'isolation propriétaire / boutique
  const existing = await db
    .select()
    .from(shops)
    .where(and(eq(shops.id, shopId), eq(shops.ownerId, sellerId)))
    .get();

  if (!existing) {
    throw new Error("Boutique introuvable ou vous n'avez pas l'autorisation de la modifier.");
  }

  const now = new Date();
  const updateData: Partial<typeof shops.$inferInsert> = {
    updatedAt: now,
  };

  if ("name" in data && typeof data.name === "string") updateData.name = data.name;
  if ("slug" in data && typeof data.slug === "string") updateData.slug = data.slug;
  if ("headline" in data && typeof data.headline === "string") updateData.headline = data.headline;
  if ("area" in data && typeof data.area === "string") updateData.area = data.area;
  if ("description" in data && typeof data.description === "string") updateData.description = data.description;
  if ("category" in data) updateData.category = (data.category as string) || null;
  if ("themeColor" in data && typeof data.themeColor === "string") updateData.themeColor = data.themeColor;
  if ("whatsapp" in data) updateData.whatsapp = (data.whatsapp as string) || null;
  if ("waveNumber" in data) updateData.waveNumber = (data.waveNumber as string) || null;
  if ("wavePaymentLink" in data) updateData.wavePaymentLink = (data.wavePaymentLink as string) || null;
  if ("orangeMoneyNumber" in data) updateData.orangeMoneyNumber = (data.orangeMoneyNumber as string) || null;
  if ("acceptsCash" in data) updateData.acceptsCash = Boolean(data.acceptsCash);
  if ("deliveryFee" in data && typeof data.deliveryFee === "number") updateData.deliveryFee = Math.max(0, Math.floor(data.deliveryFee));
  if ("deliveryNote" in data) updateData.deliveryNote = (data.deliveryNote as string) || null;
  if ("status" in data && typeof data.status === "string") updateData.status = data.status;
  if ("logoUrl" in data) updateData.logoUrl = (data.logoUrl as string) || null;
  if ("coverUrl" in data) updateData.coverUrl = (data.coverUrl as string) || null;
  if ("facebookPixelId" in data) updateData.facebookPixelId = (data.facebookPixelId as string) || null;
  if ("tiktokPixelId" in data) updateData.tiktokPixelId = (data.tiktokPixelId as string) || null;

  await db.update(shops).set(updateData).where(eq(shops.id, shopId));
  const updated = await db.select().from(shops).where(eq(shops.id, shopId)).get();
  if (!updated) throw new Error("Boutique introuvable après mise à jour.");
  await invalidateShopKvCache(existing.slug);
  if (updated.slug !== existing.slug) {
    await invalidateShopKvCache(updated.slug);
  }
  return normalizeShopRecord(updated);
}

