import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const supabase = createSupabaseServerClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (email === userData.user.email) {
      return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
    }

    // Use the new RPC to find user ID by email
    const { data: targetUserId, error: searchError } = await supabase
      .rpc("get_user_id_by_email", { p_email: email });

    if (searchError) {
      // If RPC is missing, fallback to admin client (older method)
      console.warn("RPC get_user_id_by_email not found, falling back to admin listUsers");
      const { createSupabaseAdminClient } = await import("@/lib/supabase-server");
      const adminClient = createSupabaseAdminClient();
      const { data: users, error: adminError } = await adminClient.auth.admin.listUsers();
      if (adminError) throw adminError;
      const foundUser = users.users.find(u => u.email === email);
      if (!foundUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
      
      // Perform the insert
      const { error: insertError } = await supabase
        .from("friendships")
        .insert({
          requester_id: userData.user.id,
          receiver_id: foundUser.id,
          status: "pending"
        });

      if (insertError) throw insertError;
    } else {
      if (!targetUserId) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const { error: insertError } = await supabase
        .from("friendships")
        .insert({
          requester_id: userData.user.id,
          receiver_id: targetUserId,
          status: "pending"
        });

      if (insertError) {
        if (insertError.code === "PGRST116" || insertError.message.includes("friendships' not found")) {
          return NextResponse.json({ 
            error: "Social features are not fully set up. Please run the migrations in supabase/migrations/ (specifically 007 and 009)." 
          }, { status: 500 });
        }
        if (insertError.code === "23505") {
          return NextResponse.json({ error: "Friendship already exists or is pending" }, { status: 400 });
        }
        throw insertError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Friends Request Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
