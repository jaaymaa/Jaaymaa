/**
 * Money formatting utilities for Jaay.
 * All amounts are integers in FCFA (no decimals).
 */

/**
 * Formats an integer FCFA amount for display.
 * 18500 → "18 500 FCFA"
 */
export function formatFcfa(amount: number): string {
  const formatted = amount.toLocaleString("fr-FR").replace(/\s/g, " ");
  return `${formatted} FCFA`;
}

/**
 * Parses a user-input price string to an integer in FCFA.
 * Returns null if invalid.
 * Accepts: "18500", "18 500", "18.500"
 */
export function parseFcfa(raw: string): number | null {
  const cleaned = raw.replace(/[\s.]/g, "").replace(",", "");
  const n = parseInt(cleaned, 10);
  if (isNaN(n) || n < 0) return null;
  return n;
}
