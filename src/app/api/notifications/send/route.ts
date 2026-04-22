import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

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

    // Use service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current time in HH:MM format
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:00`;

    // Find all habits with reminders enabled for this time
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, name, user_id, reminder_time, icon')
      .eq('reminder_enabled', true)
      .eq('is_active', true)
      .eq('reminder_time', currentTime);

    if (habitsError) {
      console.error('Error fetching habits:', habitsError);
      return NextResponse.json(
        { error: 'Failed to fetch habits' },
        { status: 500 }
      );
    }

    if (!habits || habits.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No habits to notify',
        sent: 0,
      });
    }

    // Get unique user IDs
    const userIds = Array.from(new Set(habits.map((h) => h.user_id)));

    // Fetch push subscriptions for these users
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found',
        sent: 0,
      });
    }

    // Group habits by user
    const habitsByUser = habits.reduce((acc, habit) => {
      if (!acc[habit.user_id]) {
        acc[habit.user_id] = [];
      }
      acc[habit.user_id].push(habit);
      return acc;
    }, {} as Record<string, typeof habits>);

    // Send notifications
    let sentCount = 0;
    const errors: string[] = [];

    for (const subscription of subscriptions) {
      const userHabits = habitsByUser[subscription.user_id];
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
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in send notifications route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
