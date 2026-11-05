import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  isValidPhone,
  formatPhone,
  whatsappLink,
} from "@/lib/phone";

describe("normalizePhone", () => {
  it("accepts a local 9-digit mobile number without prefix", () => {
    expect(normalizePhone("771234567")).toBe("+221771234567");
  });

  it("accepts a formatted local number with spaces", () => {
    expect(normalizePhone("77 123 45 67")).toBe("+221771234567");
  });

  it("accepts a +221 prefixed number", () => {
    expect(normalizePhone("+221771234567")).toBe("+221771234567");
  });

  it("accepts a 00221 prefixed number", () => {
    expect(normalizePhone("00221771234567")).toBe("+221771234567");
  });

  it("accepts a 221 prefixed number (no leading +)", () => {
    expect(normalizePhone("221771234567")).toBe("+221771234567");
  });

  it("strips dashes and dots", () => {
    expect(normalizePhone("77-123.45.67")).toBe("+221771234567");
  });

  it("accepts a landline starting with 3", () => {
    expect(normalizePhone("338001234")).toBe("+221338001234");
  });

  it("rejects a number with wrong length", () => {
    expect(normalizePhone("7712345")).toBeNull();
  });

  it("rejects a number starting with 6 (not Senegalese)", () => {
    expect(normalizePhone("661234567")).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(normalizePhone("")).toBeNull();
  });

  it("rejects letters", () => {
    expect(normalizePhone("abcdefghi")).toBeNull();
  });
});

describe("isValidPhone", () => {
  it("returns true for a valid number", () => {
    expect(isValidPhone("77 123 45 67")).toBe(true);
  });

  it("returns false for an invalid number", () => {
    expect(isValidPhone("12345")).toBe(false);
  });
});

describe("formatPhone", () => {
  it("formats a stored E.164 number for display", () => {
    expect(formatPhone("+221771234567")).toBe("77 123 45 67");
  });

  it("returns the original if not a valid E.164", () => {
    expect(formatPhone("invalid")).toBe("invalid");
  });
});

describe("whatsappLink", () => {
  it("generates a basic WhatsApp link", () => {
    expect(whatsappLink("+221771234567")).toBe("https://wa.me/221771234567");
  });

  it("appends an encoded message", () => {
    const link = whatsappLink("+221771234567", "Bonjour!");
    expect(link).toContain("?text=");
    expect(link).toContain("Bonjour");
  });
});
