import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { friendships } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { friendshipId } = await req.json();
    if (!friendshipId) return NextResponse.json({ error: "friendshipId is required" }, { status: 400 });

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .update(friendships)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(
        and(
          eq(friendships.id, friendshipId),
          eq(friendships.receiverId, session.user.id),
          eq(friendships.status, "pending")
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Friends Accept Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
