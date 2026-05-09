import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { habits, habitLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { habitId, date } = body;

    if (!habitId) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
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

    const dateStr = date ? format(new Date(date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    // Check if log already exists
    const [existingLog] = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.date, dateStr)
        )
      )
      .limit(1);

    if (existingLog) {
      // Already completed
      return NextResponse.json({ success: true, alreadyCompleted: true });
    }

    // Create completion log
    const [log] = await db
      .insert(habitLogs)
      .values({
        habitId,
        date: dateStr,
        status: 'done',
        count: 0,
      })
      .returning();

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Error in complete habit route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
