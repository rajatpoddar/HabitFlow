import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, name, email_weekly_digest')
      .eq('email_weekly_digest', true);

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    let sentCount = 0;

    for (const userProfile of users) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userProfile.id);
      if (!authUser?.user?.email) continue;

      // Calculate weekly stats (simplified)
      const completionRate = 75; // Placeholder
      const bestStreak = 7; // Placeholder
      const mostCompletedHabit = 'Morning Run'; // Placeholder

      try {
        await sendEmail({
          to: authUser.user.email,
          subject: 'Your Weekly Habit Summary 📊',
          react: WeeklyDigestEmail({
            firstName: userProfile.name?.split(' ')[0] || 'there',
            completionRate,
            bestStreak,
            mostCompletedHabit,
            analyticsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/analytics`,
          }),
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send weekly digest to ${authUser.user.email}:`, error);
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Error in weekly digest email route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
