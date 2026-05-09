import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import WeeklyDigestEmail from '@/emails/WeeklyDigestEmail';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users who opted in to weekly digest
    const usersList = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.emailWeeklyDigest, true));

    if (!usersList || usersList.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    let sentCount = 0;

    for (const user of usersList) {
      if (!user.email) continue;

      // In production, calculate these properly from the database
      const completionRate = 75; // Placeholder
      const bestStreak = 7; // Placeholder
      const mostCompletedHabit = 'Morning Run'; // Placeholder

      try {
        await sendEmail({
          to: user.email,
          subject: 'Your Weekly HabitFlow Digest 🌱',
          react: WeeklyDigestEmail({
            firstName: user.name?.split(' ')[0] || 'there',
            completionRate,
            bestStreak,
            mostCompletedHabit,
            analyticsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/analytics`,
          }),
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send weekly digest to ${user.email}:`, error);
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Error in weekly digest route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
