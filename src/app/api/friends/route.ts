import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { friendships, users } from "@/lib/db/schema";
import { eq, or, aliasedTable } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Aliased tables for joins
    const requester = aliasedTable(users, "requester");
    const receiver = aliasedTable(users, "receiver");

    // Fetch friendships with profiles using joins
    const userFriendships = await db
      .select({
        id: friendships.id,
        requester_id: friendships.requesterId,
        receiver_id: friendships.receiverId,
        status: friendships.status,
        created_at: friendships.createdAt,
        requester: {
          id: requester.id,
          name: requester.name,
          avatar_url: requester.image,
        },
        receiver: {
          id: receiver.id,
          name: receiver.name,
          avatar_url: receiver.image,
        },
      })
      .from(friendships)
      .leftJoin(requester, eq(friendships.requesterId, requester.id))
      .leftJoin(receiver, eq(friendships.receiverId, receiver.id))
      .where(or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId)));

    // Map to match the expected UI structure (social_stats placeholder)
    const enrichedFriendships = userFriendships.map((f) => ({
      ...f,
      created_at: f.created_at.toISOString(),
      requester: f.requester ? { ...f.requester, social_stats: [{ total_forest_health: 0 }] } : null,
      receiver: f.receiver ? { ...f.receiver, social_stats: [{ total_forest_health: 0 }] } : null,
    }));

    return NextResponse.json(enrichedFriendships);
  } catch (error: any) {
    console.error("Friends GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
