/// <reference types="@cloudflare/workers-types" />

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type AppDb = DrizzleD1Database<typeof schema>;

export async function getDb(customD1?: D1Database): Promise<AppDb> {
  if (customD1) {
    return drizzle(customD1, { schema });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env && (env as { DB?: D1Database }).DB) {
      return drizzle((env as { DB: D1Database }).DB, { schema });
    }
  } catch {
    // Context may not be initialized if accessed outside Cloudflare request pipeline
  }

  throw new Error(
    "Cloudflare D1 binding 'DB' introuvable dans le contexte actuel. Vérifiez wrangler.jsonc et le mode d'exécution."
  );
}

export async function getMediaBucket(): Promise<R2Bucket> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bucket = (env as { MEDIA_BUCKET?: R2Bucket }).MEDIA_BUCKET;
    if (bucket) return bucket;
  } catch {
    // Context may not be initialized
  }

  throw new Error(
    "Cloudflare R2 binding 'MEDIA_BUCKET' introuvable dans le contexte actuel."
  );
}

export async function getRoutingKV(): Promise<KVNamespace | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as { JAAYMA_ROUTING?: KVNamespace }).JAAYMA_ROUTING ?? null;
  } catch {
    return null;
  }
}
