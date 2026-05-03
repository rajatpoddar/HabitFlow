import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { friendships, users } from "@/lib/db/schema";
import { eq, or, and, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get friends (accepted friendships)
    const userFriendships = await db
      .select({
        requesterId: friendships.requesterId,
        receiverId: friendships.receiverId,
      })
      .from(friendships)
      .where(
        and(
          or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId)),
          eq(friendships.status, "accepted")
        )
      );

    const friendIds = userFriendships.map((f) =>
      f.requesterId === userId ? f.receiverId : f.requesterId
    );

    // Include the current user in the leaderboard
    friendIds.push(userId);

    // Fetch user details for the friend group
    const leaderboardUsers = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(inArray(users.id, friendIds));

    // Construct leaderboard with placeholder health points
    // (Calculation of streaks would require complex join with habit_logs)
    const leaderboard = leaderboardUsers.map((u) => ({
      user_id: u.id,
      name: u.name || "Anonymous",
      total_forest_health: 0, // Placeholder
    })).sort((a, b) => b.total_forest_health - a.total_forest_health);

    return NextResponse.json(leaderboard);
  } catch (error: any) {
    console.error("Leaderboard Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
