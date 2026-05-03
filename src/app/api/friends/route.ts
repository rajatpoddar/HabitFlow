import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { friendships, users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch friendships using Drizzle
    const userFriendships = await db
      .select({
        id: friendships.id,
        requester_id: friendships.requesterId,
        receiver_id: friendships.receiverId,
        status: friendships.status,
        created_at: friendships.createdAt,
      })
      .from(friendships)
      .where(or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId)));

    // Fetch profiles manually to simulate the join
    const enrichedFriendships = await Promise.all(
      userFriendships.map(async (f) => {
        const [requester] = await db
          .select({ id: users.id, name: users.name, image: users.image })
          .from(users)
          .where(eq(users.id, f.requester_id));

        const [receiver] = await db
          .select({ id: users.id, name: users.name, image: users.image })
          .from(users)
          .where(eq(users.id, f.receiver_id));

        return {
          ...f,
          requester: requester ? { ...requester, avatar_url: requester.image, social_stats: [{ total_forest_health: 0 }] } : null,
          receiver: receiver ? { ...receiver, avatar_url: receiver.image, social_stats: [{ total_forest_health: 0 }] } : null,
        };
      })
    );

    return NextResponse.json(enrichedFriendships);
  } catch (error: any) {
    console.error("Friends GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
