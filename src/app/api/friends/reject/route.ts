import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { friendships } from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { friendshipId } = await req.json();
    if (!friendshipId) return NextResponse.json({ error: "friendshipId is required" }, { status: 400 });

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .delete(friendships)
      .where(
        and(
          eq(friendships.id, friendshipId),
          or(
            eq(friendships.receiverId, session.user.id),
            eq(friendships.requesterId, session.user.id)
          )
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Friends Reject Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
