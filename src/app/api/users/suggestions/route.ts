import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: users, error } = await supabase.rpc("get_user_suggestions", {
      p_limit: 5
    });

    if (error) throw error;

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Suggestions Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
