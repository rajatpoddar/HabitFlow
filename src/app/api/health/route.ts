import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Basic health check
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "unknown",
    };

    // Check database connectivity
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { error } = await supabase.from("user_profiles").select("id").limit(1);
      health.database = error ? "error" : "connected";
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
