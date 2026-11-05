/**
 * Keeps absolute image URLs intact and resolves storage keys through the app's image route.
 */
export function getImageUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("data:")) return key;

  if (key.startsWith("http://") || key.startsWith("https://")) {
    try {
      const absoluteUrl = new URL(key);
      const isLocalDevHost = ["localhost", "127.0.0.1", "::1"].includes(
        absoluteUrl.hostname
      );
      const legacyKey = absoluteUrl.pathname.replace(/^\/+/, "");
      if (
        isLocalDevHost &&
        /^(logos|covers|products|misc)\//.test(legacyKey)
      ) {
        return `/api/images/${legacyKey.split("/").map(encodeURIComponent).join("/")}`;
      }
    } catch {
      return key;
    }

    return key;
  }

  const normalizedKey = key.trim().replace(/^\/+/, "");
  if (!normalizedKey) return null;
  if (normalizedKey.startsWith("api/images/")) {
    return `/${normalizedKey}`;
  }

  const encodedKey = normalizedKey.split("/").map(encodeURIComponent).join("/");
  return `/api/images/${encodedKey}`;
}
