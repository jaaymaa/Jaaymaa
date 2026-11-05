import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  hashSessionToken,
  generateSessionToken,
} from "@/services/auth.service";

describe("Auth Service — Password Hashing & Verification", () => {
  it("hashes password with PBKDF2 and creates valid salt:hash:iterations format", () => {
    const raw = "monMotDePasse123";
    const hashed = hashPassword(raw);

    const parts = hashed.split(":");
    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(32); // 16 bytes salt in hex
    expect(parts[1].length).toBe(128); // 64 bytes sha512 in hex
    expect(parts[2]).toBe("100000"); // 100,000 iterations (Cloudflare Workers max)
  });

  it("successfully verifies valid password", () => {
    const raw = "Passer123!";
    const hashed = hashPassword(raw);
    expect(verifyPassword(raw, hashed)).toBe(true);
  });

  it("rejects incorrect password", () => {
    const raw = "Passer123!";
    const hashed = hashPassword(raw);
    expect(verifyPassword("MauvaisMotDePasse", hashed)).toBe(false);
  });

  it("handles malformed hash string gracefully", () => {
    expect(verifyPassword("test", "")).toBe(false);
    expect(verifyPassword("test", "invalide")).toBe(false);
    expect(verifyPassword("test", "salt:tropcourt")).toBe(false);
  });
});

describe("Auth Service — Session Tokens", () => {
  it("generates opaque 64-character random hex token", () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it("hashes token with sha256 to 64-character hex string", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    // Deterministic hash
    expect(hashSessionToken(token)).toBe(hash);
  });
});

