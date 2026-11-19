import { describe, it, expect } from "vitest";
import {
  isValidStatusTransition,
  getNextOrderStatus,
  calculateOrderTotals,
  generateOrderNumber,
  buildOrderTimeline,
} from "../orders";

describe("orders business rules", () => {
  describe("status transitions", () => {
    it("allows valid forward transitions", () => {
      expect(isValidStatusTransition("new", "preparing")).toBe(true);
      expect(isValidStatusTransition("preparing", "out_for_delivery")).toBe(true);
      expect(isValidStatusTransition("out_for_delivery", "delivered")).toBe(true);
    });

    it("allows cancellation from any active status", () => {
      expect(isValidStatusTransition("new", "cancelled")).toBe(true);
      expect(isValidStatusTransition("preparing", "cancelled")).toBe(true);
      expect(isValidStatusTransition("out_for_delivery", "cancelled")).toBe(true);
    });

    it("rejects backwards transitions", () => {
      expect(isValidStatusTransition("preparing", "new")).toBe(false);
      expect(isValidStatusTransition("out_for_delivery", "preparing")).toBe(false);
      expect(isValidStatusTransition("out_for_delivery", "new")).toBe(false);
      expect(isValidStatusTransition("delivered", "out_for_delivery")).toBe(false);
      expect(isValidStatusTransition("delivered", "preparing")).toBe(false);
      expect(isValidStatusTransition("delivered", "new")).toBe(false);
    });

    it("rejects transitions from terminal statuses", () => {
      expect(isValidStatusTransition("delivered", "cancelled")).toBe(false);
      expect(isValidStatusTransition("cancelled", "new")).toBe(false);
      expect(isValidStatusTransition("cancelled", "preparing")).toBe(false);
      expect(isValidStatusTransition("cancelled", "delivered")).toBe(false);
    });

    it("rejects transitions to same status", () => {
      expect(isValidStatusTransition("new", "new")).toBe(false);
      expect(isValidStatusTransition("preparing", "preparing")).toBe(false);
      expect(isValidStatusTransition("delivered", "delivered")).toBe(false);
    });

    it("getNextOrderStatus returns next forward step", () => {
      expect(getNextOrderStatus("new")).toBe("preparing");
      expect(getNextOrderStatus("preparing")).toBe("out_for_delivery");
      expect(getNextOrderStatus("out_for_delivery")).toBe("delivered");
      expect(getNextOrderStatus("delivered")).toBe(null);
      expect(getNextOrderStatus("cancelled")).toBe(null);
    });
  });

  describe("calculateOrderTotals", () => {
    it("calculates subtotal and total accurately with integer FCFA values", () => {
      const items = [
        { unitPrice: 15000, quantity: 2 }, // 30000
        { unitPrice: 4500, quantity: 1 },  // 4500
      ];
      const deliveryFee = 2000;

      const result = calculateOrderTotals(items, deliveryFee);
      expect(result.subtotal).toBe(34500);
      expect(result.deliveryFee).toBe(2000);
      expect(result.total).toBe(36500);
      expect(result.itemCount).toBe(3);
    });

    it("handles zero delivery fee", () => {
      const items = [{ unitPrice: 10000, quantity: 1 }];
      const result = calculateOrderTotals(items, 0);
      expect(result.subtotal).toBe(10000);
      expect(result.deliveryFee).toBe(0);
      expect(result.total).toBe(10000);
      expect(result.itemCount).toBe(1);
    });

    it("handles empty items list", () => {
      const result = calculateOrderTotals([], 1500);
      expect(result.subtotal).toBe(0);
      expect(result.deliveryFee).toBe(1500);
      expect(result.total).toBe(1500);
      expect(result.itemCount).toBe(0);
    });

    it("rounds and prevents negative amounts", () => {
      const items = [{ unitPrice: 5000, quantity: -2 }]; // quantity normalized to at least 1
      const result = calculateOrderTotals(items, -500); // deliveryFee normalized to 0
      expect(result.subtotal).toBe(5000);
      expect(result.deliveryFee).toBe(0);
      expect(result.total).toBe(5000);
      expect(result.itemCount).toBe(1);
    });
  });

  describe("generateOrderNumber", () => {
    it("generates JY-XXXX format with valid characters", () => {
      const number = generateOrderNumber();
      expect(number).toMatch(/^JY-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
    });

    it("generates unique codes", () => {
      const codes = new Set(Array.from({ length: 50 }, () => generateOrderNumber()));
      expect(codes.size).toBe(50);
    });
  });

  describe("buildOrderTimeline", () => {
    const created = new Date("2026-11-19T10:00:00Z");
    const updated = new Date("2026-11-19T11:30:00Z");

    it("returns single event for new order", () => {
      const timeline = buildOrderTimeline({ status: "NEW", createdAt: created });
      expect(timeline).toHaveLength(1);
      expect(timeline[0].value).toBe("new");
      expect(timeline[0].date).toEqual(created);
    });

    it("returns progression for preparing order", () => {
      const timeline = buildOrderTimeline({ status: "preparing", createdAt: created, updatedAt: updated });
      expect(timeline).toHaveLength(2);
      expect(timeline.map((e) => e.value)).toEqual(["new", "preparing"]);
      expect(timeline[1].date).toEqual(updated);
    });

    it("returns progression for out_for_delivery order", () => {
      const timeline = buildOrderTimeline({ status: "out_for_delivery", createdAt: created, updatedAt: updated });
      expect(timeline).toHaveLength(3);
      expect(timeline.map((e) => e.value)).toEqual(["new", "preparing", "out_for_delivery"]);
      expect(timeline[2].date).toEqual(updated);
    });

    it("returns full progression for delivered order", () => {
      const timeline = buildOrderTimeline({ status: "DELIVERED", createdAt: created, updatedAt: updated });
      expect(timeline).toHaveLength(4);
      expect(timeline.map((e) => e.value)).toEqual(["new", "preparing", "out_for_delivery", "delivered"]);
      expect(timeline[3].date).toEqual(updated);
    });

    it("returns cancelled event for cancelled order", () => {
      const timeline = buildOrderTimeline({ status: "cancelled", createdAt: created, updatedAt: updated });
      expect(timeline).toHaveLength(2);
      expect(timeline.map((e) => e.value)).toEqual(["new", "cancelled"]);
      expect(timeline[1].date).toEqual(updated);
    });

    it("handles CONFIRMED by mapping to preparing step", () => {
      const timeline = buildOrderTimeline({ status: "CONFIRMED", createdAt: created, updatedAt: updated });
      expect(timeline).toHaveLength(2);
      expect(timeline.map((e) => e.value)).toEqual(["new", "preparing"]);
    });
  });
});
