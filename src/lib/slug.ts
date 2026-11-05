/**
 * Slug validation and reserved slug list.
 * Rules: 3-30 chars, lowercase letters, digits, hyphens only. No leading/trailing hyphens.
 */

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "espace",
  "connexion",
  "inscription",
  "explorer",
  "commande",
  "img",
  "_next",
  "static",
  "manifest",
  "sitemap",
  "robots",
  "favicon",
  "jaay",
  "support",
  "about",
  "contact",
  "terms",
  "privacy",
  "help",
  "blog",
  "www",
  "app",
  "cdn",
  "mail",
  "assets",
  "public",
]);

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$|^[a-z0-9]{3}$/;

/** Returns true if the slug is syntactically valid (no uniqueness check here). */
export function isValidSlugFormat(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

/** Returns true if the slug is in the reserved list. */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/** Returns true if the slug can be used by a shop. */
export function isAvailableSlug(slug: string): boolean {
  return isValidSlugFormat(slug) && !isReservedSlug(slug);
}

/**
 * Converts a shop name to a suggested slug.
 * "Awa Couture 2024" → "awa-couture-2024"
 */
export function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}
