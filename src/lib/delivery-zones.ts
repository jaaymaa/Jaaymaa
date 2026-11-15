import type { DeliveryZone } from "@/types/schema";

export const MAX_DELIVERY_ZONES = 30;

export function parseDeliveryZones(value: unknown): DeliveryZone[] | null {
  let candidate = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(candidate) || candidate.length > MAX_DELIVERY_ZONES) return null;

  const zones: DeliveryZone[] = [];
  const ids = new Set<string>();
  const names = new Set<string>();

  for (const item of candidate) {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const fee = record.fee;

    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id) || name.length < 2 || name.length > 80) return null;
    if (typeof fee !== "number" || !Number.isSafeInteger(fee) || fee < 0 || fee > 1_000_000) return null;

    const normalizedName = name.toLocaleLowerCase("fr");
    if (ids.has(id) || names.has(normalizedName)) return null;
    ids.add(id);
    names.add(normalizedName);
    zones.push({ id, name, fee });
  }

  return zones;
}
