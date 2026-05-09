import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, habits, habitLogs } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import StreakRiskEmail from '@/emails/StreakRiskEmail';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get users with active streaks > 3 days who haven't completed habits today
    const today = new Date().toISOString().split('T')[0];

    // Get users opted into this email
    const usersList = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.emailStreakRisk, true));

    if (!usersList || usersList.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    let sentCount = 0;

    for (const user of usersList) {
      if (!user.email) continue;

      // Get user's habits
      const userHabits = await db
        .select({ id: habits.id, name: habits.name, icon: habits.icon })
        .from(habits)
        .where(
          and(
            eq(habits.userId, user.id),
            eq(habits.isActive, true)
          )
        );

      if (!userHabits || userHabits.length === 0) continue;

      const habitIds = userHabits.map((h) => h.id);

      // Get today's logs
      const logs = await db
        .select({ habitId: habitLogs.habitId })
        .from(habitLogs)
        .where(
          and(
            inArray(habitLogs.habitId, habitIds),
            eq(habitLogs.date, today),
            eq(habitLogs.status, 'done')
          )
        );

      const completedHabitIds = new Set(logs.map(l => l.habitId));
      const incompleteHabits = userHabits
        .filter(h => !completedHabitIds.has(h.id))
        .map(h => ({ name: h.name, icon: h.icon }));

      if (incompleteHabits.length === 0) continue;

      // Calculate current streak (simplified)
      const currentStreak = 7; // Placeholder - implement proper streak calculation

      try {
        await sendEmail({
          to: user.email,
          subject: `Don't break your ${currentStreak}-day streak! 🔥`,
          react: StreakRiskEmail({
            firstName: user.name?.split(' ')[0] || 'there',
            currentStreak,
            incompleteHabits,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          }),
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send streak risk email to ${user.email}:`, error);
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Error in streak risk email route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
