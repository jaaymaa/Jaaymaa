import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "disconnected";
  let errorDetail: string | null = null;

  try {
    const db = await getDb();
    const result = await db.run(sql`SELECT 1 as alive`);
    if (result) {
      dbStatus = "connected";
    }
  } catch (err) {
    dbStatus = "error";
    errorDetail = err instanceof Error ? err.message : "Unknown database error";
  }

  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    database: dbStatus,
    durationMs,
    timestamp: new Date().toISOString(),
    ...(errorDetail ? { error: errorDetail } : {}),
  });
}

