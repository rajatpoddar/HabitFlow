import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { friendshipId } = await req.json();
    if (!friendshipId) return NextResponse.json({ error: "friendshipId is required" }, { status: 400 });

    const supabase = createSupabaseServerClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId)
      .or(`receiver_id.eq.${userData.user.id},requester_id.eq.${userData.user.id}`);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Friends Reject Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
