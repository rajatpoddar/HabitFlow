import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { email, userId } = await req.json();
    
    const supabase = createSupabaseServerClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let targetUserId = userId;

    if (!targetUserId && email) {
      if (email === userData.user.email) {
        return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
      }

      // Use the new RPC to find user ID by email
      const { data: rpcUserId, error: searchError } = await supabase
        .rpc("get_user_id_by_email", { p_email: email });

      if (searchError || !rpcUserId) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      targetUserId = rpcUserId;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID or Email is required" }, { status: 400 });
    }

    if (targetUserId === userData.user.id) {
      return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
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
          error: "Social features are not fully set up. Please run migration 009." 
        }, { status: 500 });
      }
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Friendship already exists or is pending" }, { status: 400 });
      }
      throw insertError;
    }

    // Send Push Notification to the receiver
    try {
      const { data: requesterProfile } = await supabase
        .from("user_profiles")
        .select("name")
        .eq("id", userData.user.id)
        .single();

      const { sendPushNotification } = await import("@/lib/push");
      await sendPushNotification(targetUserId, {
        title: "New Friend Request! 🌳",
        body: `${requesterProfile?.name || "Someone"} wants to grow their forest with you.`,
        icon: "/icons/icon-192x192.png",
        data: { url: "/friends" }
      });
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
      // Don't fail the request if push fails
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Friends Request Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
