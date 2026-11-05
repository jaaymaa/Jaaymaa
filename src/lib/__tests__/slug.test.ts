import { describe, it, expect } from "vitest";
import { isAvailableSlug, isReservedSlug, isValidSlugFormat, suggestSlug } from "@/lib/slug";

describe("isValidSlugFormat", () => {
  it("accepts a simple slug", () => {
    expect(isValidSlugFormat("awa-couture")).toBe(true);
  });

  it("accepts a slug with digits", () => {
    expect(isValidSlugFormat("shop42")).toBe(true);
  });

  it("accepts a minimum 3-char slug", () => {
    expect(isValidSlugFormat("abc")).toBe(true);
  });

  it("rejects slugs shorter than 3 chars", () => {
    expect(isValidSlugFormat("ab")).toBe(false);
  });

  it("rejects slugs with uppercase letters", () => {
    expect(isValidSlugFormat("Awa-Couture")).toBe(false);
  });

  it("rejects slugs with leading hyphens", () => {
    expect(isValidSlugFormat("-shop")).toBe(false);
  });

  it("rejects slugs with trailing hyphens", () => {
    expect(isValidSlugFormat("shop-")).toBe(false);
  });

  it("rejects slugs longer than 30 chars", () => {
    expect(isValidSlugFormat("a".repeat(31))).toBe(false);
  });
});

describe("isReservedSlug", () => {
  it("rejects reserved slug 'admin'", () => {
    expect(isReservedSlug("admin")).toBe(true);
  });

  it("rejects reserved slug 'espace'", () => {
    expect(isReservedSlug("espace")).toBe(true);
  });

  it("allows a non-reserved slug", () => {
    expect(isReservedSlug("awa-couture")).toBe(false);
  });
});

describe("isAvailableSlug", () => {
  it("returns true for a valid, non-reserved slug", () => {
    expect(isAvailableSlug("awa-couture")).toBe(true);
  });

  it("returns false for a reserved slug", () => {
    expect(isAvailableSlug("admin")).toBe(false);
  });

  it("returns false for an invalid format", () => {
    expect(isAvailableSlug("ab")).toBe(false);
  });
});

describe("suggestSlug", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(suggestSlug("Awa Couture")).toBe("awa-couture");
  });

  it("removes accents", () => {
    expect(suggestSlug("Café Délice")).toBe("cafe-delice");
  });

  it("collapses multiple spaces/symbols into one hyphen", () => {
    expect(suggestSlug("Shop   2024!!")).toBe("shop-2024");
  });

  it("truncates to 30 chars", () => {
    const result = suggestSlug("A".repeat(50));
    expect(result.length).toBeLessThanOrEqual(30);
  });

  it("normalizes a typed slug with spaces and accents", () => {
    expect(suggestSlug("Ma Boutique ")).toBe("ma-boutique");
  });
});
