import { ulid } from "ulid";
import { eq, and, desc, like, or, sql, gte, isNull } from "drizzle-orm";
import { getDb, getRoutingKV, products, productImages, orderItems, shops, type AppDb } from "@/db";
import type { Product, Shop } from "@/types/schema";
import { getImageUrl } from "@/lib/images";
import { canActivateProduct, getEffectivePlan, getPhotoLimit } from "@/lib/plans";

function activeProPlusPriority() {
  return sql<number>`CASE WHEN ${and(
    eq(shops.plan, "pro_plus"),
    or(isNull(shops.planExpiresAt), gte(shops.planExpiresAt, new Date()))
  )} THEN 1 ELSE 0 END`;
}

async function invalidateShopCacheByShopId(shopId: string, customDb?: AppDb) {
  try {
    const db = customDb || (await getDb());
    const shop = await db.select({ slug: shops.slug }).from(shops).where(eq(shops.id, shopId)).get();
    if (shop?.slug) {
      const kv = await getRoutingKV();
      if (kv) await kv.delete(`shop:${shop.slug.toLowerCase()}`);
    }
  } catch {
    // Ignorer si indisponible
  }
}

export async function listProductsByShop(
  shopId: string,
  customDb?: AppDb
): Promise<Product[]> {
  const db = customDb || (await getDb());

  const productList = await db
    .select()
    .from(products)
    .where(eq(products.shopId, shopId))
    .orderBy(products.position, desc(products.createdAt))
    .all();

  const productIds = productList.map((p) => p.id);
  let allImages: (typeof productImages.$inferSelect)[] = [];

  if (productIds.length > 0) {
    allImages = await db
      .select()
      .from(productImages)
      .where(sql`${productImages.productId} IN ${productIds}`)
      .orderBy(productImages.position)
      .all();
  }

  const imagesByProduct = new Map<string, typeof allImages>();
  for (const img of allImages) {
    const list = imagesByProduct.get(img.productId) || [];
    list.push(img);
    imagesByProduct.set(img.productId, list);
  }

  return productList.map((p) => {
    const imgs = imagesByProduct.get(p.id) || [];
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
      images: imgs.map((i) => ({
        id: i.id,
        productId: i.productId,
        url: i.url,
        alt: i.alt,
        position: i.position,
      })),
      imageUrl: imageUrls[0] ?? null,
      imageUrls,
      optionsJson: p.optionsJson,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });
}

export async function getProductById(
  id: string,
  customDb?: AppDb
): Promise<Product | null> {
  const db = customDb || (await getDb());
  const p = await db.select().from(products).where(eq(products.id, id)).get();
  if (!p) return null;

  const imgs = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, p.id))
    .orderBy(productImages.position)
    .all();

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
    images: imgs.map((i) => ({
      id: i.id,
      productId: i.productId,
      url: i.url,
      alt: i.alt,
      position: i.position,
    })),
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    optionsJson: p.optionsJson,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function getPublicProductByShopSlug(
  shopSlug: string,
  productId: string,
  customDb?: AppDb
): Promise<Product | null> {
  const db = customDb || (await getDb());

  const shop = await db
    .select({ id: shops.id, plan: shops.plan, planExpiresAt: shops.planExpiresAt })
    .from(shops)
    .where(eq(shops.slug, shopSlug))
    .get();
  if (!shop) return null;

  const p = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.shopId, shop.id), eq(products.status, "ACTIVE")))
    .get();

  if (!p) return null;

  const imgs = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, p.id))
    .orderBy(productImages.position)
    .limit(getPhotoLimit(getEffectivePlan(shop.plan, shop.planExpiresAt)))
    .all();

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
    images: imgs.map((i) => ({
      id: i.id,
      productId: i.productId,
      url: i.url,
      alt: i.alt,
      position: i.position,
    })),
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    optionsJson: p.optionsJson,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function exploreProducts(
  params?: { q?: string; category?: string; page?: number; limit?: number },
  customDb?: AppDb
): Promise<{
  items: Array<{ product: Product; shop: Shop; imageUrl: string | null }>;
  hasNextPage: boolean;
}> {
  const db = customDb || (await getDb());
  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, Math.min(50, params?.limit || 12));
  const offset = (page - 1) * limit;

  const conditions = [eq(products.status, "ACTIVE"), eq(shops.status, "ACTIVE")];

  if (params?.q) {
    const term = `%${params.q.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${products.name})`, term),
        like(sql`lower(${products.description})`, term),
        like(sql`lower(${shops.name})`, term)
      )!
    );
  }

  if (params?.category && params.category !== "Tous") {
    conditions.push(eq(shops.category, params.category));
  }

  const rows = await db
    .select({
      product: products,
      shop: shops,
    })
    .from(products)
    .innerJoin(shops, eq(products.shopId, shops.id))
    .where(and(...conditions))
    .orderBy(desc(activeProPlusPriority()), desc(shops.featured), desc(products.createdAt))
    .limit(limit + 1)
    .offset(offset)
    .all();

  const hasNextPage = rows.length > limit;
  const pageRows = rows.slice(0, limit);

  const productIds = pageRows.map((r) => r.product.id);
  let allImages: (typeof productImages.$inferSelect)[] = [];
  if (productIds.length > 0) {
    allImages = await db
      .select()
      .from(productImages)
      .where(sql`${productImages.productId} IN ${productIds}`)
      .orderBy(productImages.position)
      .all();
  }

  const imagesByProduct = new Map<string, typeof allImages>();
  for (const img of allImages) {
    const list = imagesByProduct.get(img.productId) || [];
    list.push(img);
    imagesByProduct.set(img.productId, list);
  }

  const items = pageRows.map(({ product: p, shop: s }) => {
    const photoLimit = getPhotoLimit(getEffectivePlan(s.plan, s.planExpiresAt));
    const imgs = (imagesByProduct.get(p.id) || []).slice(0, photoLimit);
    const imageUrls = imgs
      .map((i) => getImageUrl(i.url))
      .filter((u): u is string => Boolean(u));

    const mappedProduct: Product = {
      id: p.id,
      shopId: p.shopId,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      position: p.position,
      status: p.status as "DRAFT" | "ACTIVE" | "ARCHIVED",
      isActive: p.status === "ACTIVE",
      images: imgs.map((i) => ({
        id: i.id,
        productId: i.productId,
        url: i.url,
        alt: i.alt,
        position: i.position,
      })),
      imageUrl: imageUrls[0] ?? null,
      imageUrls,
      optionsJson: p.optionsJson,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };

    const mappedShop: Shop = {
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
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };

    return {
      product: mappedProduct,
      shop: mappedShop,
      imageUrl: imageUrls[0] ?? null,
    };
  });

  return { items, hasNextPage };
}

export async function createProduct(
  shopId: string,
  data: {
    name: string;
    description?: string;
    price: number;
    stock?: number;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
    optionsJson?: string | null;
    images?: Array<{ url: string; alt?: string; position?: number }>;
  },
  sellerId: string,
  customDb?: AppDb
): Promise<Product> {
  const db = customDb || (await getDb());

  // Vérifier propriété de la boutique
  const shop = await db
    .select()
    .from(shops)
    .where(and(eq(shops.id, shopId), eq(shops.ownerId, sellerId)))
    .get();

  if (!shop) {
    throw new Error("Boutique introuvable ou accès non autorisé.");
  }

  const effectivePlan = getEffectivePlan(shop.plan, shop.planExpiresAt);
  const photoLimit = getPhotoLimit(effectivePlan);
  if ((data.images?.length ?? 0) > photoLimit) {
    throw new Error(`Votre forfait autorise au maximum ${photoLimit} photo${photoLimit > 1 ? "s" : ""} par produit.`);
  }

  // Le statut par défaut à l'insertion est ACTIVE : vérifier ce cas aussi.
  const nextStatus = data.status ?? "ACTIVE";
  const isActive = nextStatus === "ACTIVE";
  if (isActive) {
    const activeProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.shopId, shopId), eq(products.status, "ACTIVE")))
      .all();

    if (!canActivateProduct(effectivePlan, activeProducts.length)) {
      throw new Error("Limite de produits actifs atteinte pour votre plan actuel.");
    }
  }

  const productId = ulid();
  const now = new Date();

  await db.insert(products).values({
    id: productId,
    shopId,
    name: data.name,
    description: data.description || "",
    price: Math.max(0, Math.floor(data.price)), // XOF entier garanti
    stock: typeof data.stock === "number" ? Math.max(0, Math.floor(data.stock)) : 0,
    position: 0,
    status: nextStatus,
    optionsJson: data.optionsJson || null,
    createdAt: now,
    updatedAt: now,
  });

  // Insérer images si fournies en un seul batch
  if (data.images && data.images.length > 0) {
    const imageRecords = data.images.map((img, i) => ({
      id: ulid(),
      productId,
      url: img.url,
      alt: img.alt || data.name,
      position: typeof img.position === "number" ? img.position : i,
      createdAt: now,
    }));
    await db.insert(productImages).values(imageRecords);
  }

  const created = await getProductById(productId, db);
  if (!created) throw new Error("Erreur lors de la récupération du produit créé.");
  await invalidateShopCacheByShopId(shopId, db);
  return created;
}

export async function updateProduct(
  productId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
    optionsJson?: string | null;
    images?: Array<{ url: string; alt?: string; position?: number }>;
  },
  sellerId: string,
  customDb?: AppDb
): Promise<Product> {
  const db = customDb || (await getDb());

  // Vérifier que le produit appartient bien à une boutique du vendeur
  const existingProduct = await db
    .select({
      product: products,
      shop: shops,
    })
    .from(products)
    .innerJoin(shops, eq(products.shopId, shops.id))
    .where(and(eq(products.id, productId), eq(shops.ownerId, sellerId)))
    .get();

  if (!existingProduct) {
    throw new Error("Produit introuvable ou vous n'avez pas l'autorisation de le modifier.");
  }

  const effectivePlan = getEffectivePlan(
    existingProduct.shop.plan,
    existingProduct.shop.planExpiresAt
  );
  if (data.images !== undefined) {
    const existingImages = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .all();
    const photoLimit = Math.max(getPhotoLimit(effectivePlan), existingImages.length);
    if (data.images.length > photoLimit) {
      throw new Error(`Votre forfait autorise au maximum ${getPhotoLimit(effectivePlan)} photo${getPhotoLimit(effectivePlan) > 1 ? "s" : ""} par produit.`);
    }
  }

  const nextStatus = data.status ?? existingProduct.product.status;
  if (existingProduct.product.status !== "ACTIVE" && nextStatus === "ACTIVE") {
    const activeProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.shopId, existingProduct.product.shopId), eq(products.status, "ACTIVE")))
      .all();
    if (!canActivateProduct(effectivePlan, activeProducts.length)) {
      throw new Error("Limite de produits actifs atteinte pour votre plan actuel.");
    }
  }

  const now = new Date();
  const updateData: Partial<typeof products.$inferInsert> = {
    updatedAt: now,
  };

  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = Math.max(0, Math.floor(data.price));
  if (data.stock !== undefined) updateData.stock = Math.max(0, Math.floor(data.stock));
  if (data.status) updateData.status = data.status;
  if (data.optionsJson !== undefined) updateData.optionsJson = data.optionsJson;

  await db.update(products).set(updateData).where(eq(products.id, productId));

  // Remplacer les images si une nouvelle liste est fournie
  if (data.images !== undefined) {
    await db.delete(productImages).where(eq(productImages.productId, productId));
    if (data.images.length > 0) {
      const imageRecords = data.images.map((img, i) => ({
        id: ulid(),
        productId,
        url: img.url,
        alt: img.alt || data.name || existingProduct.product.name,
        position: typeof img.position === "number" ? img.position : i,
        createdAt: now,
      }));
      await db.insert(productImages).values(imageRecords);
    }
  }

  const updated = await getProductById(productId, db);
  if (!updated) throw new Error("Erreur lors de la récupération du produit modifié.");
  await invalidateShopCacheByShopId(existingProduct.product.shopId, db);
  return updated;
}

export async function deleteProduct(
  productId: string,
  sellerId: string,
  customDb?: AppDb
): Promise<{ success: boolean }> {
  const db = customDb || (await getDb());

  // Vérifier appartenance
  const existingProduct = await db
    .select({
      productId: products.id,
      shopId: products.shopId,
    })
    .from(products)
    .innerJoin(shops, eq(products.shopId, shops.id))
    .where(and(eq(products.id, productId), eq(shops.ownerId, sellerId)))
    .get();

  if (!existingProduct) {
    throw new Error("Produit introuvable ou vous n'avez pas l'autorisation de le supprimer.");
  }

  const hasOrderHistory = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .where(eq(orderItems.productId, productId))
    .limit(1)
    .get();

  if (hasOrderHistory) {
    // Keep the product row so existing order items retain their foreign-key target.
    await db
      .update(products)
      .set({ status: "ARCHIVED", updatedAt: new Date() })
      .where(eq(products.id, productId));
  } else {
    // D1 does not guarantee FK cascades unless foreign-key enforcement is enabled.
    await db.delete(productImages).where(eq(productImages.productId, productId));
    try {
      await db.delete(products).where(eq(products.id, productId));
    } catch (error) {
      // A new order may have referenced the product after the history check.
      const orderCreatedDuringDelete = await db
        .select({ id: orderItems.id })
        .from(orderItems)
        .where(eq(orderItems.productId, productId))
        .limit(1)
        .get();

      if (!orderCreatedDuringDelete) throw error;

      await db
        .update(products)
        .set({ status: "ARCHIVED", updatedAt: new Date() })
        .where(eq(products.id, productId));
    }
  }

  await invalidateShopCacheByShopId(existingProduct.shopId, db);
  return { success: true };
}

