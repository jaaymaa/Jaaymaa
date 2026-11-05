const FALLBACK_SHARE_IMAGE = "/icons/icon-512.png";

/** Returns the first usable HTTPS image as an absolute URL for social crawlers. */
export function getSocialImageUrl(origin: string, ...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      const imageUrl = new URL(candidate, origin);
      if (imageUrl.protocol === "https:") return imageUrl.toString();
    } catch {
      // Ignore malformed or unsupported image URLs and try the next one.
    }
  }

  return new URL(FALLBACK_SHARE_IMAGE, origin).toString();
}
