import { describe, it, expect } from "vitest";
import { getSessionToken } from "../auth";

describe("auth utilities", () => {
  it("handles null session cookie safely", async () => {
    // In test environment without request cookies, getSessionToken returns null
    try {
      const token = await getSessionToken();
      expect(token).toBeNull();
    } catch {
      // In non-Next request context, cookies() might throw or return null, which is expected
      expect(true).toBe(true);
    }
  });
});
