import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "unknown",
    };

    try {
      await db.execute(sql`SELECT 1`);
      health.database = "connected";
    } catch (e) {
      health.database = "error";
    }

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "error",
      },
      { status: 503 }
    );
  }
}
