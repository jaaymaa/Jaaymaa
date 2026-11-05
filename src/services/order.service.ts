import { ulid } from "ulid";
import { randomBytes } from "node:crypto";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { getDb, orders, orderItems, products, shops, type AppDb } from "@/db";
import type { Order, OrderItem } from "@/types/schema";
import { normalizePhone } from "@/lib/phone";
import { normalizeShopRecord } from "./shop.service";

function generatePublicToken(): string {
  return Buffer.from(randomBytes(16))
    .toString("base64url")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function generateOrderReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `JYM-${code}`;
}

export async function createOrder(
  data: {
    shopId: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    note?: string;
    paymentMethod: "wave" | "orange_money" | "cash";
    items: Array<{
      productId: string;
      quantity: number;
      options?: string | null;
    }>;
  },
  customDb?: AppDb
): Promise<Order> {
  const db = customDb || (await getDb());

  // 1. Validation de la boutique
  const shop = await db.select().from(shops).where(eq(shops.id, data.shopId)).get();
  if (!shop || shop.status !== "ACTIVE") {
    throw new Error("Cette boutique n'est pas disponible pour passer commande.");
  }

  // 2. Validation du client
  const customerName = data.customerName.trim();
  const deliveryAddress = data.deliveryAddress.trim();
  const phone = normalizePhone(data.customerPhone);
  if (!customerName || !deliveryAddress || !phone) {
    throw new Error("Veuillez renseigner toutes les informations de livraison obligatoires.");
  }

  if (!data.items || data.items.length === 0) {
    throw new Error("Le panier est vide.");
  }

  if (data.items.length > 20) {
    throw new Error("Une commande ne peut pas dépasser 20 articles.");
  }

  // 3. Récupération des prix autoritatifs en base (ne jamais faire confiance aux montants du client)
  const productIds = data.items.map((i) => i.productId);
  const dbProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.shopId, data.shopId), sql`${products.id} IN ${productIds}`))
    .all();

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  let subtotal = 0;
  const validatedItems: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    options: string | null;
    name: string;
  }> = [];

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product || product.status !== "ACTIVE") {
      throw new Error(`Le produit sélectionné n'est plus disponible.`);
    }

    const quantity = Math.max(1, Math.min(50, Math.floor(item.quantity || 1)));
    const unitPrice = product.price; // Entier XOF strict depuis D1
    subtotal += unitPrice * quantity;

    validatedItems.push({
      productId: product.id,
      quantity,
      unitPrice,
      options: item.options || null,
      name: product.name,
    });
  }

  const deliveryFee = Math.max(0, Math.floor(shop.deliveryFee || 0));
  const total = subtotal + deliveryFee;

  const orderId = ulid();
  let reference = generateOrderReference();
  const publicToken = generatePublicToken();
  const now = new Date();

  // Éviter collision sur reference
  for (let attempt = 0; attempt < 5; attempt++) {
    const existingRef = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.reference, reference))
      .get();

    if (!existingRef) break;
    reference = generateOrderReference();
  }

  await db.insert(orders).values({
    id: orderId,
    reference,
    publicToken,
    shopId: data.shopId,
    customerName,
    customerPhone: phone,
    deliveryAddress,
    note: data.note?.trim() || null,
    paymentMethod: data.paymentMethod,
    paymentStatus: "pending",
    subtotal,
    deliveryFee,
    total,
    status: "NEW",
    createdAt: now,
    updatedAt: now,
  });

  const orderItemsData = validatedItems.map((item) => ({
    id: ulid(),
    orderId,
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    options: item.options,
  }));

  if (orderItemsData.length > 0) {
    await db.insert(orderItems).values(orderItemsData);
  }

  return {
    id: orderId,
    reference,
    publicToken,
    shopId: data.shopId,
    customerName,
    customerPhone: phone,
    customerAddress: deliveryAddress,
    note: data.note?.trim() || null,
    paymentMethod: data.paymentMethod,
    paymentStatus: "pending",
    subtotal,
    deliveryFee,
    total,
    status: "NEW",
    items: orderItemsData.map((item) => ({
      ...item,
      name: productMap.get(item.productId)?.name,
    })),
    shop: normalizeShopRecord(shop),
    createdAt: now,
    updatedAt: now,
  };
}

export async function getOrderByPublicToken(
  tokenOrRef: string,
  customDb?: AppDb
): Promise<Order | null> {
  const db = customDb || (await getDb());

  const orderRecord = await db
    .select()
    .from(orders)
    .where(or(eq(orders.publicToken, tokenOrRef), eq(orders.reference, tokenOrRef)))
    .get();

  if (!orderRecord) return null;

  const shop = await db.select().from(shops).where(eq(shops.id, orderRecord.shopId)).get();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderRecord.id)).all();

  const productIds = items.map((i) => i.productId);
  let dbProducts: (typeof products.$inferSelect)[] = [];
  if (productIds.length > 0) {
    dbProducts = await db.select().from(products).where(sql`${products.id} IN ${productIds}`).all();
  }
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  const mappedItems: OrderItem[] = items.map((i) => {
    const prod = productMap.get(i.productId);
    return {
      id: i.id,
      orderId: i.orderId,
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      options: i.options,
      name: prod?.name,
      product: prod
        ? {
            id: prod.id,
            shopId: prod.shopId,
            name: prod.name,
            description: prod.description,
            price: prod.price,
            stock: prod.stock,
            position: prod.position,
            status: prod.status as "DRAFT" | "ACTIVE" | "ARCHIVED",
            createdAt: prod.createdAt,
            updatedAt: prod.updatedAt,
          }
        : undefined,
    };
  });

  return {
    id: orderRecord.id,
    reference: orderRecord.reference,
    publicToken: orderRecord.publicToken,
    shopId: orderRecord.shopId,
    customerName: orderRecord.customerName,
    customerPhone: orderRecord.customerPhone,
    customerAddress: orderRecord.deliveryAddress,
    note: orderRecord.note,
    paymentMethod: orderRecord.paymentMethod,
    paymentStatus: orderRecord.paymentStatus,
    subtotal: orderRecord.subtotal,
    deliveryFee: orderRecord.deliveryFee,
    total: orderRecord.total,
    status: orderRecord.status,
    items: mappedItems,
    shop: shop
      ? {
          id: shop.id,
          slug: shop.slug,
          name: shop.name,
          headline: shop.headline,
          deliveryFee: shop.deliveryFee,
          whatsapp: shop.whatsapp,
          waveNumber: shop.waveNumber,
          wavePaymentLink: shop.wavePaymentLink,
          orangeMoneyNumber: shop.orangeMoneyNumber,
          themeColor: shop.themeColor,
          logoUrl: shop.logoUrl,
          coverUrl: shop.coverUrl,
        }
      : undefined,
    createdAt: orderRecord.createdAt,
    updatedAt: orderRecord.updatedAt,
  };
}

export async function getOrderById(
  orderId: string,
  sellerId: string,
  customDb?: AppDb
): Promise<Order | null> {
  const db = customDb || (await getDb());

  const result = await db
    .select({
      order: orders,
      shop: shops,
    })
    .from(orders)
    .innerJoin(shops, eq(orders.shopId, shops.id))
    .where(and(eq(orders.id, orderId), eq(shops.ownerId, sellerId)))
    .get();

  if (!result) return null;

  return getOrderByPublicToken(result.order.publicToken, db);
}

export async function listOrdersByShop(
  shopId: string,
  sellerId: string,
  customDb?: AppDb
): Promise<Order[]> {
  const db = customDb || (await getDb());

  // Vérifier propriété de la boutique
  const shop = await db
    .select({ id: shops.id })
    .from(shops)
    .where(and(eq(shops.id, shopId), eq(shops.ownerId, sellerId)))
    .get();

  if (!shop) {
    throw new Error("Accès non autorisé aux commandes de cette boutique.");
  }

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.shopId, shopId))
    .orderBy(desc(orders.createdAt))
    .all();

  const orderIds = orderRows.map((o) => o.id);
  let allItems: (typeof orderItems.$inferSelect)[] = [];
  if (orderIds.length > 0) {
    allItems = await db.select().from(orderItems).where(sql`${orderItems.orderId} IN ${orderIds}`).all();
  }

  const itemsByOrder = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = itemsByOrder.get(item.orderId) || [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  return orderRows.map((o) => {
    const items = itemsByOrder.get(o.id) || [];
    return {
      id: o.id,
      reference: o.reference,
      publicToken: o.publicToken,
      shopId: o.shopId,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerAddress: o.deliveryAddress,
      note: o.note,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      total: o.total,
      status: o.status,
      items: items.map((i) => ({
        id: i.id,
        orderId: i.orderId,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        options: i.options,
      })),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  });
}

export async function updateOrderStatus(
  orderId: string,
  sellerId: string,
  status?: string,
  paymentStatus?: string,
  customDb?: AppDb
): Promise<Order> {
  const db = customDb || (await getDb());

  const existing = await db
    .select({
      orderId: orders.id,
      publicToken: orders.publicToken,
    })
    .from(orders)
    .innerJoin(shops, eq(orders.shopId, shops.id))
    .where(and(eq(orders.id, orderId), eq(shops.ownerId, sellerId)))
    .get();

  if (!existing) {
    throw new Error("Commande introuvable ou vous n'avez pas l'autorisation de la modifier.");
  }

  const updateData: Partial<typeof orders.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (status) updateData.status = status;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;

  await db.update(orders).set(updateData).where(eq(orders.id, orderId));

  const updated = await getOrderByPublicToken(existing.publicToken, db);
  if (!updated) throw new Error("Erreur lors de la mise à jour de la commande.");
  return updated;
}

