import { describe, it, expect } from "vitest";
import { formatFcfa, parseFcfa } from "@/lib/money";

describe("formatFcfa", () => {
  it("formats a basic amount", () => {
    expect(formatFcfa(18500)).toBe("18 500 FCFA");
  });

  it("formats zero", () => {
    expect(formatFcfa(0)).toBe("0 FCFA");
  });

  it("formats a large amount", () => {
    expect(formatFcfa(1000000)).toBe("1 000 000 FCFA");
  });

  it("formats a small amount below 1000", () => {
    expect(formatFcfa(500)).toBe("500 FCFA");
  });
});

describe("parseFcfa", () => {
  it("parses a plain integer string", () => {
    expect(parseFcfa("18500")).toBe(18500);
  });

  it("parses a space-separated string", () => {
    expect(parseFcfa("18 500")).toBe(18500);
  });

  it("parses a dot-separated string (European style)", () => {
    expect(parseFcfa("18.500")).toBe(18500);
  });

  it("returns null for negative values", () => {
    expect(parseFcfa("-100")).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parseFcfa("abc")).toBeNull();
  });

  it("parses zero", () => {
    expect(parseFcfa("0")).toBe(0);
  });
});
