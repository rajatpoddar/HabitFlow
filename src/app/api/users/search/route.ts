import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    
    if (!query) return NextResponse.json([]);

    const supabase = createSupabaseServerClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: users, error } = await supabase.rpc("search_users_by_name", {
      p_query: query,
      p_limit: 10
    });

    if (error) throw error;

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Search Users Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
