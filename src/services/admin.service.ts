import { eq, and, desc, count, sum, sql, like, or, gte, lt, isNull, inArray, exists, notExists } from "drizzle-orm";
import { getDb, shops, products, orders, users, platformSettings, adminBroadcasts, orderItems, pushSubscriptions, type AppDb } from "@/db";
import { normalizePhone } from "@/lib/phone";
import { invalidateShopKvCache } from "@/services/shop.service";
import { getGoogleAnalyticsDashboard, getGoogleAnalyticsRealtime } from "@/services/google-analytics.service";
import { isPushConfigured } from "@/services/notification.service";

export function isUserAdmin(phone?: string | null): boolean {
  if (!phone) return false;
  const adminPhonesEnv = process.env.ADMIN_PHONES || "";
  const adminList = adminPhonesEnv
    .split(",")
    .map((p) => normalizePhone(p.trim()))
    .filter(Boolean);

  const normalizedUserPhone = normalizePhone(phone);
  return adminList.includes(normalizedUserPhone);
}

export async function verifyAdmin(phone: string): Promise<boolean> {
  return isUserAdmin(phone);
}

export async function getAdminSettings(customDb?: AppDb) {
  const db = customDb || (await getDb());
  const adminPhonesEnv = process.env.ADMIN_PHONES || "";
  const admins = adminPhonesEnv
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  let settings = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.id, "global"))
    .get();

  if (!settings) {
    const now = new Date();
    await db.insert(platformSettings).values({
      id: "global",
      explorerEnabled: true,
      maintenanceEnabled: false,
      proPriceXof: 1000,
      proPlusPriceXof: 10000,
      updatedAt: now,
    });
    settings = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, "global"))
      .get();
  }

  const [subscriptionCount] = await db.select({ count: count() }).from(pushSubscriptions);

  return {
    admins,
    pushSubscriptions: Number(subscriptionCount?.count || 0),
    push: { configured: isPushConfigured(), subject: process.env.VAPID_SUBJECT || null },
    databaseConnected: true,
    explorerEnabled: Boolean(settings?.explorerEnabled),
    maintenanceEnabled: Boolean(settings?.maintenanceEnabled),
    proPriceXof: settings?.proPriceXof ?? 1000,
    proPlusPriceXof: settings?.proPlusPriceXof ?? 10000,
  };
}

export async function getPublicFeatures(customDb?: AppDb): Promise<{
  explorerEnabled: boolean;
  maintenanceEnabled: boolean;
}> {
  try {
    const db = customDb || (await getDb());
    const settings = await db
      .select({
        explorerEnabled: platformSettings.explorerEnabled,
        maintenanceEnabled: platformSettings.maintenanceEnabled,
      })
      .from(platformSettings)
      .where(eq(platformSettings.id, "global"))
      .get();

    return {
      explorerEnabled: settings ? Boolean(settings.explorerEnabled) : true,
      maintenanceEnabled: settings ? Boolean(settings.maintenanceEnabled) : false,
    };
  } catch {
    return { explorerEnabled: true, maintenanceEnabled: false };
  }
}

export async function getAdminOverview(customDb?: AppDb) {
  const db = customDb || (await getDb());

  const [totalShopsRes] = await db.select({ count: count() }).from(shops);
  const [activeShopsRes] = await db.select({ count: count() }).from(shops).where(eq(shops.status, "ACTIVE"));
  const [draftShopsRes] = await db.select({ count: count() }).from(shops).where(eq(shops.status, "DRAFT"));
  const [suspendedShopsRes] = await db.select({ count: count() }).from(shops).where(eq(shops.status, "SUSPENDED"));
  const [proShopsRes] = await db.select({ count: count() }).from(shops).where(eq(shops.plan, "pro"));
  const [proPlusShopsRes] = await db.select({ count: count() }).from(shops).where(eq(shops.plan, "pro_plus"));

  const [sellersRes] = await db.select({ count: count() }).from(users);
  const [activeProductsRes] = await db.select({ count: count() }).from(products).where(eq(products.status, "ACTIVE"));

  const [totalOrdersRes] = await db.select({ count: count() }).from(orders);
  const [newOrdersRes] = await db.select({ count: count() }).from(orders).where(eq(orders.status, "NEW"));
  const [paidOrdersRes] = await db.select({ count: count() }).from(orders).where(eq(orders.paymentStatus, "paid"));
  const [revenueRes] = await db.select({ total: sum(orders.total) }).from(orders).where(eq(orders.paymentStatus, "paid"));

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const [todayOrdersRes] = await db.select({ count: count() }).from(orders).where(gte(orders.createdAt, startOfDay));
  const [todayRevenueRes] = await db
    .select({ total: sum(orders.total) })
    .from(orders)
    .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, startOfDay)));

  const recentOrders = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      customerName: orders.customerName,
      total: orders.total,
      createdAt: orders.createdAt,
      shop: {
        name: shops.name,
        slug: shops.slug,
      },
    })
    .from(orders)
    .innerJoin(shops, eq(orders.shopId, shops.id))
    .orderBy(desc(orders.createdAt))
    .limit(10)
    .all();

  return {
    metrics: {
      totalShops: totalShopsRes?.count || 0,
      activeShops: activeShopsRes?.count || 0,
      draftShops: draftShopsRes?.count || 0,
      suspendedShops: suspendedShopsRes?.count || 0,
      proShops: proShopsRes?.count || 0,
      proPlusShops: proPlusShopsRes?.count || 0,
      expiredProShops: 0,
      expiredProPlusShops: 0,
      sellers: sellersRes?.count || 0,
      activeProducts: activeProductsRes?.count || 0,
      totalOrders: totalOrdersRes?.count || 0,
      newOrders: newOrdersRes?.count || 0,
      paidOrders: paidOrdersRes?.count || 0,
      revenue: Number(revenueRes?.total || 0),
      todayOrders: todayOrdersRes?.count || 0,
      revenueToday: Number(todayRevenueRes?.total || 0),
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      reference: o.reference,
      customerName: o.customerName,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
      shop: o.shop,
    })),
  };
}

export async function getAdminShops(
  params: { q?: string; status?: string; plan?: string; page?: number },
  customDb?: AppDb
) {
  const db = customDb || (await getDb());
  const page = Math.max(1, params.page || 1);
  const pageSize = 15;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (params.q) {
    const term = `%${params.q.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${shops.name})`, term),
        like(sql`lower(${shops.slug})`, term),
        like(sql`lower(${users.name})`, term),
        like(users.phone, term)
      )!
    );
  }
  if (params.status && params.status !== "ALL") {
    conditions.push(eq(shops.status, params.status));
  }
  if (params.plan && params.plan !== "ALL" && params.plan !== "all") {
    const now = new Date();
    if (params.plan === "expired") {
      conditions.push(
        and(
          or(eq(shops.plan, "pro"), eq(shops.plan, "pro_plus")),
          lt(shops.planExpiresAt, now)
        )!
      );
    } else if (params.plan === "pro" || params.plan === "pro_plus") {
      conditions.push(
        and(
          eq(shops.plan, params.plan),
          or(isNull(shops.planExpiresAt), gte(shops.planExpiresAt, now))
        )!
      );
    } else {
      conditions.push(eq(shops.plan, params.plan));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [[totalRes], shopRows] = await Promise.all([
    db
      .select({ count: count() })
      .from(shops)
      .leftJoin(users, eq(shops.ownerId, users.id))
      .where(whereClause),
    db
      .select({
        shop: {
          id: shops.id,
          name: shops.name,
          slug: shops.slug,
          plan: shops.plan,
          planExpiresAt: shops.planExpiresAt,
          status: shops.status,
          createdAt: shops.createdAt,
          whatsapp: shops.whatsapp,
        },
        owner: {
          name: users.name,
          phone: users.phone,
        },
      })
      .from(shops)
      .leftJoin(users, eq(shops.ownerId, users.id))
      .where(whereClause)
      .orderBy(desc(shops.createdAt))
      .limit(pageSize)
      .offset(offset)
      .all(),
  ]);

  const total = totalRes?.count || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const shopIds = shopRows.map(({ shop }) => shop.id);
  const [productCounts, orderCounts] = shopIds.length
    ? await Promise.all([
        db
          .select({ shopId: products.shopId, count: count() })
          .from(products)
          .where(inArray(products.shopId, shopIds))
          .groupBy(products.shopId)
          .all(),
        db
          .select({ shopId: orders.shopId, count: count() })
          .from(orders)
          .where(inArray(orders.shopId, shopIds))
          .groupBy(orders.shopId)
          .all(),
      ])
    : [[], []];
  const productCountByShop = new Map(productCounts.map(({ shopId, count: total }) => [shopId, total]));
  const orderCountByShop = new Map(orderCounts.map(({ shopId, count: total }) => [shopId, total]));

  const items = shopRows.map(({ shop, owner }) => ({
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    plan: shop.plan,
    planExpiresAt: shop.planExpiresAt ? shop.planExpiresAt.toISOString() : null,
    status: shop.status,
    createdAt: shop.createdAt.toISOString(),
    whatsapp: shop.whatsapp,
    owner: owner?.phone ? { name: owner.name, phone: owner.phone } : null,
    _count: {
      products: productCountByShop.get(shop.id) || 0,
      orders: orderCountByShop.get(shop.id) || 0,
    },
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getAdminSubscriptions(
  params: { q?: string; plan?: string; page?: number },
  customDb?: AppDb
) {
  const db = customDb || (await getDb());
  const now = new Date();
  const [stats, shopsPage] = await Promise.all([
    db
      .select({
        totalShops: count(),
        proShops: sql<number>`count(case when ${and(
          eq(shops.plan, "pro"),
          or(isNull(shops.planExpiresAt), gte(shops.planExpiresAt, now))
        )} then 1 end)`,
        proPlusShops: sql<number>`count(case when ${and(
          eq(shops.plan, "pro_plus"),
          or(isNull(shops.planExpiresAt), gte(shops.planExpiresAt, now))
        )} then 1 end)`,
        expiredProShops: sql<number>`count(case when ${and(
          eq(shops.plan, "pro"),
          lt(shops.planExpiresAt, now)
        )} then 1 end)`,
        expiredProPlusShops: sql<number>`count(case when ${and(
          eq(shops.plan, "pro_plus"),
          lt(shops.planExpiresAt, now)
        )} then 1 end)`,
      })
      .from(shops)
      .get(),
    getAdminShops(params, db),
  ]);

  return {
    metrics: {
      totalShops: stats?.totalShops || 0,
      proShops: stats?.proShops || 0,
      proPlusShops: stats?.proPlusShops || 0,
      expiredProShops: stats?.expiredProShops || 0,
      expiredProPlusShops: stats?.expiredProPlusShops || 0,
    },
    shops: shopsPage,
  };
}

export async function getAdminOrders(
  params: { q?: string; status?: string; payment?: string; page?: number },
  customDb?: AppDb
) {
  const db = customDb || (await getDb());
  const page = Math.max(1, params.page || 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (params.q) {
    const term = `%${params.q.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${orders.reference})`, term),
        like(sql`lower(${orders.customerName})`, term),
        like(orders.customerPhone, term)
      )!
    );
  }
  if (params.status && params.status !== "ALL") {
    conditions.push(eq(orders.status, params.status));
  }
  if (params.payment && params.payment !== "ALL") {
    conditions.push(eq(orders.paymentStatus, params.payment));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRes] = await db.select({ count: count() }).from(orders).where(whereClause);
  const total = totalRes?.count || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const orderRows = await db
    .select({
      order: orders,
      shop: {
        name: shops.name,
        slug: shops.slug,
      },
    })
    .from(orders)
    .innerJoin(shops, eq(orders.shopId, shops.id))
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset(offset)
    .all();

  const items = await Promise.all(
    orderRows.map(async ({ order: o, shop }) => {
      const [itemsCount] = await db.select({ count: count() }).from(orderItems).where(eq(orderItems.orderId, o.id));
      return {
        id: o.id,
        reference: o.reference,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        total: o.total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt.toISOString(),
        shop,
        _count: { items: itemsCount?.count || 0 },
      };
    })
  );

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getAdminAccounts(
  params: { q?: string; hasShop?: string; page?: number },
  customDb?: AppDb
) {
  const db = customDb || (await getDb());
  const page = Math.max(1, params.page || 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (params.q) {
    const term = `%${params.q.trim().toLowerCase()}%`;
    conditions.push(or(like(sql`lower(${users.name})`, term), like(users.phone, term))!);
  }
  const hasShopQuery = db.select({ id: shops.id }).from(shops).where(eq(shops.ownerId, users.id));
  if (params.hasShop === "true") conditions.push(exists(hasShopQuery));
  if (params.hasShop === "false") conditions.push(notExists(hasShopQuery));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [totalRes] = await db.select({ count: count() }).from(users).where(whereClause);
  const total = totalRes?.count || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset)
    .all();

  const items = await Promise.all(
    userRows.map(async (u) => {
      const [userShops, orderCountResult] = await Promise.all([
        db
          .select({
            id: shops.id,
            name: shops.name,
            slug: shops.slug,
            plan: shops.plan,
            status: shops.status,
          })
          .from(shops)
          .where(eq(shops.ownerId, u.id))
          .all(),
        db
          .select({ count: count() })
          .from(orders)
          .innerJoin(shops, eq(orders.shopId, shops.id))
          .where(eq(shops.ownerId, u.id))
          .get(),
      ]);
      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        createdAt: u.createdAt.toISOString(),
        shopCount: userShops.length,
        orderCount: orderCountResult?.count ?? 0,
        shops: userShops.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          plan: s.plan,
          status: s.status,
        })),
      };
    })
  );

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getAdminNotificationHistory(page = 1, customDb?: AppDb) {
  const db = customDb || (await getDb());
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const [totalRes] = await db.select({ count: count() }).from(adminBroadcasts);
  const total = totalRes?.count || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const records = await db
    .select()
    .from(adminBroadcasts)
    .orderBy(desc(adminBroadcasts.createdAt))
    .limit(pageSize)
    .offset(offset)
    .all();

  return {
    items: records.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      url: r.url,
      targetCount: r.targetCount,
      deliveredCount: r.deliveredCount,
      failedCount: r.failedCount,
      sentByPhone: r.sentByPhone,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getAdminAnalytics(days: 7 | 28 | 90 | 365) {
  return getGoogleAnalyticsDashboard(days);
}

export async function getAdminAnalyticsRealtime() {
  return getGoogleAnalyticsRealtime();
}

export async function setExplorerEnabled(enabled: boolean, customDb?: AppDb) {
  const db = customDb || (await getDb());
  await db
    .insert(platformSettings)
    .values({
      id: "global",
      explorerEnabled: enabled,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: { explorerEnabled: enabled, updatedAt: new Date() },
    });
  return { explorerEnabled: enabled };
}

export async function setMaintenanceEnabled(enabled: boolean, customDb?: AppDb) {
  const db = customDb || (await getDb());
  await db
    .insert(platformSettings)
    .values({
      id: "global",
      maintenanceEnabled: enabled,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: { maintenanceEnabled: enabled, updatedAt: new Date() },
    });
  return { maintenanceEnabled: enabled };
}

export async function setProPrice(amount: number, customDb?: AppDb) {
  const db = customDb || (await getDb());
  const clean = Math.max(0, Math.floor(amount));
  await db
    .insert(platformSettings)
    .values({
      id: "global",
      proPriceXof: clean,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: { proPriceXof: clean, updatedAt: new Date() },
    });
  return { proPriceXof: clean };
}

export async function setProPlusPrice(amount: number, customDb?: AppDb) {
  const db = customDb || (await getDb());
  const clean = Math.max(0, Math.floor(amount));
  await db
    .insert(platformSettings)
    .values({
      id: "global",
      proPlusPriceXof: clean,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: { proPlusPriceXof: clean, updatedAt: new Date() },
    });
  return { proPlusPriceXof: clean };
}

export async function adminUpdateShopPlan(
  shopId: string,
  plan: "free" | "pro" | "pro_plus",
  durationDays = 30,
  customDb?: AppDb
) {
  const db = customDb || (await getDb());
  const currentShop = await db
    .select({ planExpiresAt: shops.planExpiresAt, slug: shops.slug })
    .from(shops)
    .where(eq(shops.id, shopId))
    .get();

  if (!currentShop) throw new Error("Boutique introuvable.");

  let expiresAt: Date | null = null;
  if (plan === "pro" || plan === "pro_plus") {
    const now = Date.now();
    const currentExpiry = currentShop.planExpiresAt?.getTime() ?? 0;
    expiresAt = new Date(Math.max(now, currentExpiry) + durationDays * 24 * 60 * 60 * 1000);
  }

  await db
    .update(shops)
    .set({
      plan,
      planExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(shops.id, shopId));

  if (!customDb) await invalidateShopKvCache(currentShop.slug);

  return { success: true };
}

export async function adminUpdateShopStatus(
  shopId: string,
  status: "ACTIVE" | "SUSPENDED" | "DRAFT",
  customDb?: AppDb
) {
  const db = customDb || (await getDb());
  await db
    .update(shops)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(shops.id, shopId));

  return { success: true };
}
