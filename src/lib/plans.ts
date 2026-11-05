/**
 * Plan limits and helpers for Jaaymaa.
 * Free plan: 10 active products, 1 photo per product.
 * Pro plan: 100 active products, 3 photos per product (monthly).
 * Pro+ plan: 200 active products, 4 photos per product (monthly).
 */

export type Plan = "free" | "pro" | "pro_plus";

export const PLAN_LIMITS = {
  free: {
    maxActiveProducts: 10,
    maxPhotosPerProduct: 1,
  },
  pro: {
    maxActiveProducts: 100,
    maxPhotosPerProduct: 3,
  },
  pro_plus: {
    maxActiveProducts: 200,
    maxPhotosPerProduct: 4,
  },
} as const satisfies Record<Plan, { maxActiveProducts: number; maxPhotosPerProduct: number }>;

export function isPaidPlan(plan?: string | null): boolean {
  return plan === "pro" || plan === "pro_plus";
}

/** Returns the effective plan, considering expiry. */
export function getEffectivePlan(
  plan?: string | null,
  planExpiresAt?: number | string | Date | null
): Plan {
  if (plan === "pro" || plan === "pro_plus") {
    const now = Math.floor(Date.now() / 1000);
    const expiresUnix =
      typeof planExpiresAt === "number"
        ? planExpiresAt > 1e12
          ? Math.floor(planExpiresAt / 1000)
          : planExpiresAt
        : planExpiresAt
          ? Math.floor(new Date(planExpiresAt).getTime() / 1000)
          : null;
    if (expiresUnix && expiresUnix < now) {
      return "free"; // Expired
    }
    return plan;
  }
  return "free";
}

/** Returns true if the shop can activate more products. */
export function canActivateProduct(
  effectivePlan: Plan,
  currentActiveCount: number
): boolean {
  return currentActiveCount < PLAN_LIMITS[effectivePlan].maxActiveProducts;
}

/** Returns true if the shop can add another photo to a product. */
export function canAddPhoto(
  effectivePlan: Plan,
  currentPhotoCount: number
): boolean {
  return currentPhotoCount < PLAN_LIMITS[effectivePlan].maxPhotosPerProduct;
}

/** Returns the product limit for a given plan. */
export function getProductLimit(effectivePlan: Plan): number {
  return PLAN_LIMITS[effectivePlan].maxActiveProducts;
}

/** Returns the photo limit for a given plan. */
export function getPhotoLimit(effectivePlan: Plan): number {
  return PLAN_LIMITS[effectivePlan].maxPhotosPerProduct;
}

/**
 * Returns the number of full days remaining on a paid subscription.
 * Returns null if not Pro/Pro+ or if planExpiresAt is missing.
 */
export function getProDaysRemaining(
  plan?: string | null,
  planExpiresAt?: number | string | Date | null
): number | null {
  if (!isPaidPlan(plan) || !planExpiresAt) return null;
  const expiresMs =
    typeof planExpiresAt === "number"
      ? planExpiresAt > 1e12
        ? planExpiresAt       // already ms
        : planExpiresAt * 1000 // unix seconds → ms
      : new Date(planExpiresAt).getTime();
  const diff = expiresMs - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

/**
 * Returns a visual urgency level based on remaining paid days:
 * - "expired"  → 0 days left
 * - "critical" → 1–3 days left
 * - "warning"  → 4–7 days left
 * - "ok"       → 8+ days
 * - null       → not paid plan
 */
export function getProUrgency(
  plan?: string | null,
  planExpiresAt?: number | string | Date | null
): "expired" | "critical" | "warning" | "ok" | null {
  const days = getProDaysRemaining(plan, planExpiresAt);
  if (days === null) return null;
  if (days <= 0) return "expired";
  if (days <= 3) return "critical";
  if (days <= 7) return "warning";
  return "ok";
}
