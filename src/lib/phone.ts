/**
 * Phone number utilities for Senegalese phone numbers.
 * Supports: +221XXXXXXXXX, 00221XXXXXXXXX, 77 123 45 67 (9-digit local)
 */

/** Normalizes a Senegalese phone number to E.164 format (+221XXXXXXXXX). */
export function normalizePhone(raw: string): string | null {
  // Strip all whitespace, dashes, dots, parentheses
  const stripped = raw.replace(/[\s\-().]/g, "");

  let local: string;

  if (stripped.startsWith("+221")) {
    local = stripped.slice(4); // Remove +221
  } else if (stripped.startsWith("00221")) {
    local = stripped.slice(5); // Remove 00221
  } else if (stripped.startsWith("221")) {
    local = stripped.slice(3); // Remove 221
  } else {
    local = stripped;
  }

  // Validate: 9 digits, starting with 7 (mobile) or 3 (landline)
  if (!/^[73]\d{8}$/.test(local)) {
    return null;
  }

  return `+221${local}`;
}

/** Returns true if the phone number is a valid Senegalese mobile number. */
export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw) !== null;
}

/**
 * Formats a stored E.164 number for display.
 * +221771234567 → "77 123 45 67"
 */
export function formatPhone(e164: string): string {
  const local = e164.replace(/^\+221/, "");
  if (local.length !== 9) return e164;
  return `${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
}

/** Builds a WhatsApp link from a stored E.164 number. */
export function whatsappLink(e164: string, message?: string): string {
  const number = e164.replace("+", "");
  const base = `https://wa.me/${number}`;
  if (message) return `${base}?text=${encodeURIComponent(message)}`;
  return base;
}
