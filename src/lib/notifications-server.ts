import { db } from "@/lib/db";
import { friendships, users } from "@/lib/db/schema";
import { and, eq, or } from "drizzle-orm";
import { sendPushNotification } from "@/lib/push";

export async function notifyFriends(
  userId: string,
  payload: { title: string; body: string; icon?: string; data?: any }
) {
  try {
    // Get friends where status is accepted
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

    if (friendIds.length === 0) return;

    // Get friends who have friendUpdatesEnabled = true
    const enabledFriends = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.friendUpdatesEnabled, true));

    const enabledFriendIds = new Set(enabledFriends.map((f) => f.id));

    const friendsToNotify = friendIds.filter((id) => enabledFriendIds.has(id));

    // Send push notification to all eligible friends
    await Promise.allSettled(
      friendsToNotify.map((friendId) => sendPushNotification(friendId, payload))
    );
  } catch (error) {
    console.error("Failed to notify friends:", error);
  }
}
