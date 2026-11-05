import { getImageUrl } from "@/lib/images";

export function getProductImageUrlLists(
  products: Array<{ id: string; images?: Array<{ url: string; position?: number }> }>
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const product of products) {
    const urls = (product.images ?? [])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((img) => getImageUrl(img.url))
      .filter((u): u is string => Boolean(u));
    map[product.id] = urls;
  }
  return map;
}

export function parseImageKeys(formData: FormData, field = "imageKeys"): string[] {
  return formData
    .getAll(field)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}
