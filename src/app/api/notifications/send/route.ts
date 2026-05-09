import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/db';
import { habits, pushSubscriptions } from '@/lib/db/schema';
import { eq, inArray, like, and } from 'drizzle-orm';

// Configure web-push with VAPID keys
if (process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current time window
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    // Build a window prefix: current minute HH:MM
    const timePrefix = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    console.log(`[notifications/send] Querying habits for time: ${timePrefix} (Server TZ Offset: ${now.getTimezoneOffset()})`);

    // Find all habits with reminders enabled for this time
    // Using .like matches both '09:30' and '09:30:00'
    const habitsList = await db
      .select({
        id: habits.id,
        name: habits.name,
        userId: habits.userId,
        reminderTime: habits.reminderTime,
        icon: habits.icon,
      })
      .from(habits)
      .where(
        and(
          eq(habits.reminderEnabled, true),
          eq(habits.isActive, true),
          like(habits.reminderTime, `${timePrefix}%`)
        )
      );

    if (!habitsList || habitsList.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No habits to notify',
        window: timePrefix,
        sent: 0,
      });
    }

    // Get unique user IDs
    const userIds = Array.from(new Set(habitsList.map((h) => h.userId)));

    // Fetch push subscriptions for these users
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(inArray(pushSubscriptions.userId, userIds));

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found',
        habitsFound: habitsList.length,
        sent: 0,
      });
    }

    // Group habits by user
    const habitsByUser = habitsList.reduce((acc, habit) => {
      if (!acc[habit.userId]) {
        acc[habit.userId] = [];
      }
      acc[habit.userId].push(habit);
      return acc;
    }, {} as Record<string, typeof habitsList>);

    // Send notifications
    let sentCount = 0;
    const errors: string[] = [];

    for (const subscription of subscriptions) {
      const userHabits = habitsByUser[subscription.userId];
      if (!userHabits || userHabits.length === 0) continue;

      // Send one notification per habit
      for (const habit of userHabits) {
        try {
          const payload = JSON.stringify({
            title: `Time for: ${habit.name}`,
            body: "Keep your streak alive! 🔥",
            habitId: habit.id,
            icon: '/icons/icon-192.png',
          });

          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, payload);
          sentCount++;
        } catch (error: any) {
          console.error(
            `Error sending notification for habit ${habit.id}:`,
            error
          );
          errors.push(`Habit ${habit.id}: ${error.message}`);

          // If subscription is invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, subscription.id));
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in send route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
