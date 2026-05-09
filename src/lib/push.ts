import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

// Initialize web-push with VAPID keys from environment variables
const vapidDetails = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
  subject: `mailto:${process.env.VAPID_EMAIL || "support@habitflow.com"}`,
};

if (vapidDetails.publicKey && vapidDetails.privateKey) {
  webpush.setVapidDetails(
    vapidDetails.subject,
    vapidDetails.publicKey,
    vapidDetails.privateKey
  );
}

export async function sendPushNotification(userId: string, payload: { title: string; body: string; icon?: string; data?: any }) {
  try {
    // Fetch all push subscriptions for the user
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (!subscriptions || subscriptions.length === 0) return;

    const notificationPayload = JSON.stringify(payload);

    // Send to all registered devices
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload
        )
      )
    );

    // Clean up expired subscriptions
    const expiredSubscriptions = results
      .map((res, i) => (res.status === "rejected" && (res.reason.statusCode === 404 || res.reason.statusCode === 410) ? subscriptions[i].id : null))
      .filter((id): id is string => id !== null);

    if (expiredSubscriptions.length > 0) {
      await db
        .delete(pushSubscriptions)
        .where(inArray(pushSubscriptions.id, expiredSubscriptions));
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}
