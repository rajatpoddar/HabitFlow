import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get users with active streaks > 3 days who haven't completed habits today
    const today = new Date().toISOString().split('T')[0];

    // This is a simplified version - in production, you'd calculate streaks properly
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, name, email_streak_risk')
      .eq('email_streak_risk', true);

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    let sentCount = 0;

    for (const userProfile of users) {
      // Get user email from auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(userProfile.id);
      if (!authUser?.user?.email) continue;

      // Get user's habits
      const { data: habits } = await supabase
        .from('habits')
        .select('id, name, icon')
        .eq('user_id', userProfile.id)
        .eq('is_active', true);

      if (!habits || habits.length === 0) continue;

      // Get today's logs
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_id')
        .in('habit_id', habits.map(h => h.id))
        .eq('date', today)
        .eq('status', 'done');

      const completedHabitIds = new Set(logs?.map(l => l.habit_id) || []);
      const incompleteHabits = habits
        .filter(h => !completedHabitIds.has(h.id))
        .map(h => ({ name: h.name, icon: h.icon }));

      if (incompleteHabits.length === 0) continue;

      // Calculate current streak (simplified)
      const currentStreak = 7; // Placeholder - implement proper streak calculation

      try {
        await sendEmail({
          to: authUser.user.email,
          subject: `Don't break your ${currentStreak}-day streak! 🔥`,
          react: StreakRiskEmail({
            firstName: userProfile.name?.split(' ')[0] || 'there',
            currentStreak,
            incompleteHabits,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          }),
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send streak risk email to ${authUser.user.email}:`, error);
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
