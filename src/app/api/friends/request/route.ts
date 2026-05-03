import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { friendships, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email, userId } = await req.json();
    
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let targetUserId = userId;

    if (!targetUserId && email) {
      if (email === session.user.email) {
        return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
      }

      // Use Drizzle to find user ID by email
      const [targetUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      targetUserId = targetUser.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID or Email is required" }, { status: 400 });
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
    }

    try {
      await db.insert(friendships).values({
        requesterId: session.user.id,
        receiverId: targetUserId,
        status: "pending"
      });
    } catch (insertError: any) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "Friendship already exists or is pending" }, { status: 400 });
      }
      throw insertError;
    }

    // Send Push Notification to the receiver
    try {
      const [requesterProfile] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, session.user.id));

      const { sendPushNotification } = await import("@/lib/push");
      await sendPushNotification(targetUserId, {
        title: "New Friend Request! 🌳",
        body: `${requesterProfile?.name || "Someone"} wants to grow their forest with you.`,
        icon: "/icons/icon-192x192.png",
        data: { url: "/friends" }
      });
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
      // Don't fail the request if push fails
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Friends Request Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
