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

    // Find user by email (we need an admin client because emails are in auth.users)
    // Actually, we should search user_profiles. Wait, does user_profiles have email?
    // Let's check schema. `user_profiles` doesn't have email by default. It's in auth.users.
    // Let's use the RPC function or admin client.
    // We can also allow searching by name, but email is safer.
    
    // Instead of querying auth.users which needs service_role, let's look up via an edge function or just use name for now.
    // Wait, the API can use service role.
    const { createSupabaseAdminClient } = await import("@/lib/supabase-server");
    const adminClient = createSupabaseAdminClient();
    
    const { data: users, error: searchError } = await adminClient.auth.admin.listUsers();
    if (searchError) throw searchError;

    const targetUser = users.users.find(u => u.email === email);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error: insertError } = await supabase
      .from("friendships")
      .insert({
        requester_id: userData.user.id,
        receiver_id: targetUser.id,
        status: "pending"
      });

    if (insertError) {
      if (insertError.code === "23505") { // unique violation
        return NextResponse.json({ error: "Friendship already exists or is pending" }, { status: 400 });
      }
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Friends Request Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
