import { describe, it, expect } from "vitest";
import {
  users,
  sessions,
  shops,
  products,
  orders,
  orderItems,
  platformSettings,
} from "@/db/schema";

describe("D1 Database Schema", () => {
  it("defines all core tables with primary keys and expected columns", () => {
    expect(users.id).toBeDefined();
    expect(users.phone).toBeDefined();
    expect(users.passwordHash).toBeDefined();

    expect(sessions.id).toBeDefined();
    expect(sessions.userId).toBeDefined();
    expect(sessions.tokenHash).toBeDefined();

    expect(shops.id).toBeDefined();
    expect(shops.slug).toBeDefined();
    expect(shops.deliveryFee).toBeDefined();

    expect(products.id).toBeDefined();
    expect(products.price).toBeDefined();
    expect(products.shopId).toBeDefined();

    expect(orders.id).toBeDefined();
    expect(orders.reference).toBeDefined();
    expect(orders.publicToken).toBeDefined();
    expect(orders.total).toBeDefined();

    expect(orderItems.id).toBeDefined();
    expect(orderItems.unitPrice).toBeDefined();

    expect(platformSettings.id).toBeDefined();
    expect(platformSettings.proPriceXof).toBeDefined();
  });
});

