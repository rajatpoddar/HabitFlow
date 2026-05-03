import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { feedLikes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entryId, like } = await request.json();
    if (!entryId) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
    }

    const userId = session.user.id;

    if (like) {
      // Add like
      try {
        await db.insert(feedLikes).values({
          userId,
          journalEntryId: entryId,
        });
      } catch (err: any) {
        // Ignore duplicate key error
        if (err.code !== '23505') throw err;
      }
    } else {
      // Remove like
      await db
        .delete(feedLikes)
        .where(
          and(
            eq(feedLikes.userId, userId),
            eq(feedLikes.journalEntryId, entryId)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Feed Like Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
