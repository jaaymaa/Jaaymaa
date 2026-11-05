import { ulid } from "ulid";
import { randomBytes } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { getDb, subscriptionPayments, platformSettings, shops, type AppDb } from "@/db";

export async function getSubscriptionPrices(customDb?: AppDb): Promise<{
  proPriceXof: number;
  proPlusPriceXof: number;
}> {
  const db = customDb || (await getDb());
  const settings = await db
    .select({
      proPriceXof: platformSettings.proPriceXof,
      proPlusPriceXof: platformSettings.proPlusPriceXof,
    })
    .from(platformSettings)
    .where(eq(platformSettings.id, "global"))
    .get();

  return {
    proPriceXof: settings?.proPriceXof ?? 1000,
    proPlusPriceXof: settings?.proPlusPriceXof ?? 10000,
  };
}

export async function createSubscriptionPaymentIntent(
  shopId: string,
  method: "wave" | "orange_money",
  plan: "pro" | "pro_plus",
  sellerId: string,
  customDb?: AppDb
): Promise<{
  id: string;
  reference: string;
  amount: number;
  method: "wave" | "orange_money";
  paymentUrl: string;
}> {
  const db = customDb || (await getDb());

  // Vérifier propriétaire boutique
  const shop = await db
    .select({ id: shops.id })
    .from(shops)
    .where(and(eq(shops.id, shopId), eq(shops.ownerId, sellerId)))
    .get();

  if (!shop) {
    throw new Error("Boutique introuvable ou accès refusé.");
  }

  const prices = await getSubscriptionPrices(db);
  const amount = plan === "pro_plus" ? prices.proPlusPriceXof : prices.proPriceXof;

  const id = ulid();
  const refCode = Buffer.from(randomBytes(4)).toString("hex").toUpperCase();
  const reference = `SUB-${refCode}`;
  const now = new Date();

  await db.insert(subscriptionPayments).values({
    id,
    shopId,
    reference,
    amount,
    currency: "XOF",
    method,
    plan,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    reference,
    amount,
    method,
    paymentUrl: `/espace/abonnement?paiement=${id}`,
  };
}

export async function getSubscriptionPayment(
  paymentId: string,
  sellerId: string,
  customDb?: AppDb
): Promise<{
  id: string;
  status: "pending" | "paid" | "failed" | "expired";
  plan: "pro" | "pro_plus";
  amount: number;
  currency: string;
  method: "wave" | "orange_money";
  createdAt: string;
  paidAt: string | null;
} | null> {
  const db = customDb || (await getDb());

  const result = await db
    .select({
      payment: subscriptionPayments,
      shop: shops,
    })
    .from(subscriptionPayments)
    .innerJoin(shops, eq(subscriptionPayments.shopId, shops.id))
    .where(and(eq(subscriptionPayments.id, paymentId), eq(shops.ownerId, sellerId)))
    .get();

  if (!result) return null;

  return {
    id: result.payment.id,
    status: result.payment.status as "pending" | "paid" | "failed" | "expired",
    plan: result.payment.plan === "pro_plus" ? "pro_plus" : "pro",
    amount: result.payment.amount,
    currency: result.payment.currency,
    method: result.payment.method as "wave" | "orange_money",
    createdAt: result.payment.createdAt.toISOString(),
    paidAt: result.payment.paidAt ? result.payment.paidAt.toISOString() : null,
  };
}

