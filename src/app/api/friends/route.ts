import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: friendships, error } = await supabase
      .from("friendships")
      .select(`
        id,
        requester_id,
        receiver_id,
        status,
        created_at,
        requester:user_profiles!requester_id(id, name, avatar_url),
        receiver:user_profiles!receiver_id(id, name, avatar_url)
      `)
      .or(`requester_id.eq.${userData.user.id},receiver_id.eq.${userData.user.id}`);

    if (error) throw error;

    return NextResponse.json(friendships);
  } catch (error: any) {
    console.error("Friends GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
