import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { friendships, users, journalEntries, feedLikes } from "@/lib/db/schema";
import { eq, or, and, inArray, desc } from "drizzle-orm";

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

    // Include the current user's shared entries too
    friendIds.push(userId);

    if (friendIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch shared journal entries from these users
    const feed = await db
      .select({
        id: journalEntries.id,
        user_id: journalEntries.userId,
        date: journalEntries.date,
        good_text: journalEntries.goodText,
        bad_text: journalEntries.badText,
        journal_text: journalEntries.journalText,
        is_shared: journalEntries.isShared,
        created_at: journalEntries.createdAt,
        user: {
          name: users.name,
          avatar_url: users.image,
          occupation: users.occupation,
        },
      })
      .from(journalEntries)
      .innerJoin(users, eq(journalEntries.userId, users.id))
      .where(
        and(
          inArray(journalEntries.userId, friendIds),
          eq(journalEntries.isShared, true)
        )
      )
      .orderBy(desc(journalEntries.createdAt))
      .limit(50);

    // Fetch likes for these entries
    const feedIds = feed.map((f) => f.id);
    let allLikes: { journalEntryId: string; userId: string }[] = [];
    
    if (feedIds.length > 0) {
      allLikes = await db
        .select({
          journalEntryId: feedLikes.journalEntryId,
          userId: feedLikes.userId,
        })
        .from(feedLikes)
        .where(inArray(feedLikes.journalEntryId, feedIds));
    }

    // Map likes into the feed
    const enrichedFeed = feed.map((entry) => {
      const entryLikes = allLikes.filter((l) => l.journalEntryId === entry.id);
      return {
        ...entry,
        created_at: entry.created_at.toISOString(),
        likes: entryLikes.length,
        has_liked: entryLikes.some((l) => l.userId === userId),
      };
    });

    return NextResponse.json(enrichedFeed);
  } catch (error: any) {
    console.error("Feed GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
