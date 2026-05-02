import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get friends (accepted friendships)
    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${userData.user.id},receiver_id.eq.${userData.user.id}`)
      .eq("status", "accepted");

    const friendIds = friendships
      ? friendships.map((f) =>
          f.requester_id === userData.user.id ? f.receiver_id : f.requester_id
        )
      : [];

    // Include the current user in the leaderboard
    friendIds.push(userData.user.id);

    // Fetch stats for all users in the friend group
    const { data: stats, error: statsError } = await supabase
      .from("social_stats")
      .select("user_id, total_forest_health")
      .in("user_id", friendIds)
      .order("total_forest_health", { ascending: false });

    if (statsError) {
      console.error("Stats Error:", statsError);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    // Get user names for the leaderboard
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("id, name")
      .in("id", friendIds);

    if (usersError) {
      console.error("Users Error:", usersError);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    const leaderboard = stats.map((stat) => {
      const user = users.find((u) => u.id === stat.user_id);
      return {
        user_id: stat.user_id,
        name: user?.name || "Anonymous",
        total_forest_health: stat.total_forest_health,
      };
    });

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Leaderboard Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
