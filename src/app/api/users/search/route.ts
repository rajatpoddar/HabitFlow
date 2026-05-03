import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, friendships } from "@/lib/db/schema";
import { ilike, ne, notExists, or, and, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    
    if (!query) return NextResponse.json([]);

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Search users by name, excluding current user and existing friends/pending requests
    const searchResults = await db
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
          ilike(users.name, `%${query}%`),
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
      .limit(10);

    // Simulate total_forest_health = 0
    const resultsWithStats = searchResults.map(u => ({ ...u, total_forest_health: 0 }));

    return NextResponse.json(resultsWithStats);
  } catch (error: any) {
    console.error("Search Users Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
