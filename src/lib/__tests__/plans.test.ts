import { describe, it, expect } from "vitest";
import {
  getEffectivePlan,
  canActivateProduct,
  canAddPhoto,
  getProductLimit,
  getPhotoLimit,
} from "@/lib/plans";

const NOW = Math.floor(Date.now() / 1000);
const FUTURE = NOW + 30 * 24 * 60 * 60;
const PAST = NOW - 1;

describe("getEffectivePlan", () => {
  it("returns 'free' for a free plan", () => {
    expect(getEffectivePlan("free", null)).toBe("free");
  });

  it("returns 'pro' for a valid pro plan", () => {
    expect(getEffectivePlan("pro", FUTURE)).toBe("pro");
  });

  it("returns 'free' when pro has expired", () => {
    expect(getEffectivePlan("pro", PAST)).toBe("free");
  });

  it("returns 'free' when pro has no expiry date", () => {
    expect(getEffectivePlan("pro", null)).toBe("pro"); // no expiry = perpetual
  });
});

describe("canActivateProduct", () => {
  it("allows activation when under free limit (10)", () => {
    expect(canActivateProduct("free", 9)).toBe(true);
  });

  it("denies activation when at free limit", () => {
    expect(canActivateProduct("free", 10)).toBe(false);
  });

  it("allows activation when under pro limit (75)", () => {
    expect(canActivateProduct("pro", 74)).toBe(true);
  });

  it("denies activation when at pro limit (75)", () => {
    expect(canActivateProduct("pro", 75)).toBe(false);
  });

  it("allows activation when under pro_plus limit (150)", () => {
    expect(canActivateProduct("pro_plus", 149)).toBe(true);
  });

  it("denies activation when at pro_plus limit (150)", () => {
    expect(canActivateProduct("pro_plus", 150)).toBe(false);
  });
});

describe("canAddPhoto", () => {
  it("allows 1 photo on free plan", () => {
    expect(canAddPhoto("free", 0)).toBe(true);
  });

  it("denies second photo on free plan", () => {
    expect(canAddPhoto("free", 1)).toBe(false);
  });

  it("allows 3 photos on pro plan", () => {
    expect(canAddPhoto("pro", 2)).toBe(true);
  });

  it("denies 4th photo on pro plan", () => {
    expect(canAddPhoto("pro", 3)).toBe(false);
  });

  it("allows 5 photos on pro_plus plan", () => {
    expect(canAddPhoto("pro_plus", 4)).toBe(true);
  });

  it("denies 6th photo on pro_plus plan", () => {
    expect(canAddPhoto("pro_plus", 5)).toBe(false);
  });
});

describe("getProductLimit and getPhotoLimit", () => {
  it("returns correct limits for free plan", () => {
    expect(getProductLimit("free")).toBe(10);
    expect(getPhotoLimit("free")).toBe(1);
  });

  it("returns correct limits for pro plan", () => {
    expect(getProductLimit("pro")).toBe(75);
    expect(getPhotoLimit("pro")).toBe(3);
  });

  it("returns correct limits for pro_plus plan", () => {
    expect(getProductLimit("pro_plus")).toBe(150);
    expect(getPhotoLimit("pro_plus")).toBe(5);
  });
});
