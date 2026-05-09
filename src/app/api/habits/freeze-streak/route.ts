import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, habits, habitLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { habitId } = body;

    if (!habitId) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
        { status: 400 }
      );
    }

    // Get user profile to check streak freezes
    const [profile] = await db
      .select({ streakFreezes: users.streakFreezes, plan: users.plan })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (profile.streakFreezes <= 0) {
      return NextResponse.json(
        { error: 'No streak freezes available' },
        { status: 400 }
      );
    }

    // Verify habit belongs to user
    const [habit] = await db
      .select({ id: habits.id })
      .from(habits)
      .where(
        and(
          eq(habits.id, habitId),
          eq(habits.userId, session.user.id)
        )
      )
      .limit(1);

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const today = format(new Date(), 'yyyy-MM-dd');

    // Check if already has a log for today
    const [existingLog] = await db
      .select({ id: habitLogs.id })
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.date, today)
        )
      )
      .limit(1);

    if (existingLog) {
      return NextResponse.json(
        { error: 'Habit already completed or frozen today' },
        { status: 400 }
      );
    }

    // Create freeze log
    await db.insert(habitLogs).values({
      habitId,
      date: today,
      status: 'done',
      count: 0,
    });

    // Deduct one freeze
    await db
      .update(users)
      .set({ streakFreezes: profile.streakFreezes - 1 })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      remaining: profile.streakFreezes - 1,
    });
  } catch (error) {
    console.error('Error in freeze streak route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
