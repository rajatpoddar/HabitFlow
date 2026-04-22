import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import StreakMilestoneEmail from '@/emails/StreakMilestoneEmail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, milestone, habitName } = body;

    if (!email || !firstName || !milestone || !habitName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

    await sendEmail({
      to: email,
      subject: `🎉 ${milestone}-Day Streak Milestone Reached!`,
      react: StreakMilestoneEmail({ firstName, milestone, habitName, dashboardUrl }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending milestone email:', error);
    return NextResponse.json(
      { error: 'Failed to send milestone email' },
      { status: 500 }
    );
  }
}
