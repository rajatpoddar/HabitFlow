import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import WelcomeEmail from '@/emails/WelcomeEmail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName } = body;

    if (!email || !firstName) {
      return NextResponse.json(
        { error: 'Email and firstName are required' },
        { status: 400 }
      );
    }

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

    await sendEmail({
      to: email,
      subject: 'Welcome to HabitFlow! 🌿',
      react: WelcomeEmail({ firstName, dashboardUrl }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}
