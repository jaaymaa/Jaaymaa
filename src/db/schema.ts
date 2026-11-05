import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── USERS & SESSIONS ───

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("seller"), // "seller" | "admin"
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_sessions_user_id").on(table.userId),
    index("idx_sessions_token_hash").on(table.tokenHash),
    index("idx_sessions_expires_at").on(table.expiresAt),
  ]
);

// Password sign-in attempts for the native admin app; the key contains only a hash of the client IP.
export const adminMobileLoginAttempts = sqliteTable(
  "admin_mobile_login_attempts",
  {
    id: text("id").primaryKey(),
    windowStartedAt: integer("window_started_at", { mode: "timestamp" }).notNull(),
    attempts: integer("attempts").notNull().default(0),
  },
  (table) => [index("idx_admin_mobile_login_attempts_window").on(table.windowStartedAt)]
);

// ─── SHOPS ───

export const shops = sqliteTable(
  "shops",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    headline: text("headline").notNull().default(""),
    area: text("area").notNull().default(""),
    description: text("description").notNull().default(""),
    category: text("category"),
    themeColor: text("theme_color").notNull().default("#C8265A"),
    whatsapp: text("whatsapp"),
    waveNumber: text("wave_number"),
    wavePaymentLink: text("wave_payment_link"),
    orangeMoneyNumber: text("orange_money_number"),
    acceptsCash: integer("accepts_cash", { mode: "boolean" }).notNull().default(true),
    deliveryFee: integer("delivery_fee").notNull().default(0), // XOF integer
    deliveryNote: text("delivery_note"),
    logoUrl: text("logo_url"), // R2 key or public URL
    coverUrl: text("cover_url"), // R2 key or public URL
    facebookPixelId: text("facebook_pixel_id"),
    tiktokPixelId: text("tiktok_pixel_id"),
    rating: real("rating").notNull().default(0),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    plan: text("plan").notNull().default("free"), // "free" | "pro" | "pro_plus"
    planExpiresAt: integer("plan_expires_at", { mode: "timestamp" }),
    proReminder3DaysSentAt: integer("pro_reminder_3days_sent_at", { mode: "timestamp" }),
    proReminder1DaySentAt: integer("pro_reminder_1day_sent_at", { mode: "timestamp" }),
    status: text("status").notNull().default("ACTIVE"), // "DRAFT" | "ACTIVE" | "SUSPENDED"
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_shops_owner_id").on(table.ownerId),
    index("idx_shops_slug").on(table.slug),
    index("idx_shops_status_featured_created").on(table.status, table.featured, table.createdAt),
    index("idx_shops_category").on(table.category),
    index("idx_shops_area").on(table.area),
  ]
);

// ─── PRODUCTS & PRODUCT MEDIA ───

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    shopId: text("shopId")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    price: integer("price").notNull(), // XOF integer
    stock: integer("stock").notNull().default(0),
    position: integer("position").notNull().default(0),
    status: text("status").notNull().default("ACTIVE"), // "DRAFT" | "ACTIVE" | "ARCHIVED"
    optionsJson: text("options_json"), // JSON string
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_products_shop_status_pos").on(table.shopId, table.status, table.position),
    index("idx_products_shop_position").on(table.shopId, table.position),
    index("idx_products_created_at").on(table.createdAt),
  ]
);

export const productImages = sqliteTable(
  "product_images",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(), // R2 key or legacy key
    alt: text("alt").notNull().default(""),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_product_images_product_pos").on(table.productId, table.position),
  ]
);

// ─── ORDERS & ORDER ITEMS ───

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    reference: text("reference").notNull().unique(), // e.g. JYM-1234
    publicToken: text("public_token").notNull().unique(), // Secure unpredictable random token for tracking URL
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    deliveryAddress: text("delivery_address").notNull(),
    note: text("note"),
    paymentMethod: text("payment_method").notNull().default("cash"), // "cash" | "wave" | "orange_money"
    paymentStatus: text("payment_status").notNull().default("pending"), // "pending" | "paid" | "failed"
    subtotal: integer("subtotal").notNull(), // XOF integer
    deliveryFee: integer("delivery_fee").notNull().default(0), // XOF integer
    total: integer("total").notNull(), // XOF integer
    status: text("status").notNull().default("NEW"), // "NEW" | "CONFIRMED" | "PAID" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED"
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_orders_shop_status_created").on(table.shopId, table.status, table.createdAt),
    index("idx_orders_shop_created").on(table.shopId, table.createdAt),
    index("idx_orders_customer_phone").on(table.customerPhone),
    index("idx_orders_public_token").on(table.publicToken),
    index("idx_orders_reference").on(table.reference),
  ]
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(), // XOF integer at order time
    options: text("options"), // Snapshot options selected
  },
  (table) => [
    index("idx_order_items_order_id").on(table.orderId),
  ]
);

// ─── SUBSCRIPTION PAYMENTS ───

export const subscriptionPayments = sqliteTable(
  "subscription_payments",
  {
    id: text("id").primaryKey(),
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    reference: text("reference").unique(),
    providerTransactionId: text("provider_transaction_id").unique(),
    amount: integer("amount").notNull(), // XOF integer
    currency: text("currency").notNull().default("XOF"),
    method: text("method").notNull(), // "wave" | "orange_money"
    plan: text("plan").notNull().default("pro"), // "pro" | "pro_plus"
    status: text("status").notNull().default("pending"), // "pending" | "paid" | "failed" | "expired"
    paidAt: integer("paid_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_sub_payments_shop_created").on(table.shopId, table.createdAt),
    index("idx_sub_payments_status_created").on(table.status, table.createdAt),
  ]
);

// ─── PLATFORM SETTINGS ───

export const platformSettings = sqliteTable("platform_settings", {
  id: text("id").primaryKey().default("global"),
  explorerEnabled: integer("explorer_enabled", { mode: "boolean" }).notNull().default(true),
  maintenanceEnabled: integer("maintenance_enabled", { mode: "boolean" }).notNull().default(false),
  proPriceXof: integer("pro_price_xof").notNull().default(1000),
  proPlusPriceXof: integer("pro_plus_price_xof").notNull().default(10000),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ─── ANALYTICS & VISITS ───

export const shopVisits = sqliteTable(
  "shop_visits",
  {
    id: text("id").primaryKey(),
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    visitedAt: integer("visited_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_shop_visits_shop_visited").on(table.shopId, table.visitedAt),
  ]
);

// ─── NOTIFICATIONS & BROADCASTS ───

export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_push_subs_user_id").on(table.userId),
  ]
);

export const adminBroadcasts = sqliteTable(
  "admin_broadcasts",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    url: text("url").notNull(),
    targetCount: integer("target_count").notNull().default(0),
    deliveredCount: integer("delivered_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    sentByPhone: text("sent_by_phone"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_admin_broadcasts_created").on(table.createdAt),
  ]
);

// ─── RELATIONS ───

export const usersRelations = relations(users, ({ many }) => ({
  shops: many(shops),
  sessions: many(sessions),
  pushSubscriptions: many(pushSubscriptions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  owner: one(users, {
    fields: [shops.ownerId],
    references: [users.id],
  }),
  products: many(products),
  orders: many(orders),
  subscriptionPayments: many(subscriptionPayments),
  visits: many(shopVisits),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  shop: one(shops, {
    fields: [products.shopId],
    references: [shops.id],
  }),
  images: many(productImages),
  orderItems: many(orderItems),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  shop: one(shops, {
    fields: [orders.shopId],
    references: [shops.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const subscriptionPaymentsRelations = relations(subscriptionPayments, ({ one }) => ({
  shop: one(shops, {
    fields: [subscriptionPayments.shopId],
    references: [shops.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

