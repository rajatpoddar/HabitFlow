import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, friendships } from "@/lib/db/schema";
import { ne, notExists, or, and, eq, sql, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const suggestedUsers = await db
      .select({
        id: users.id,
        name: users.name,
        avatar_url: users.image,
        occupation: users.occupation,
        location: users.location,
      })
      .from(users)
      .where(
        and(
          ne(users.id, userId),
          notExists(
            db.select().from(friendships).where(
              or(
                and(eq(friendships.requesterId, userId), eq(friendships.receiverId, users.id)),
                and(eq(friendships.requesterId, users.id), eq(friendships.receiverId, userId))
              )
            )
          )
        )
      )
      .orderBy(desc(users.createdAt))
      .limit(5);

    // Simulate total_forest_health = 0
    const resultsWithStats = suggestedUsers.map(u => ({ ...u, total_forest_health: 0 }));

    return NextResponse.json(resultsWithStats);
  } catch (error: any) {
    console.error("Suggestions Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
