import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { habits as habitsTable, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface HabitToCreate {
  name: string;
  icon: string;
  category: string;
  reminderTime: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { habits, reminderTimes } = body as {
      habits: HabitToCreate[];
      reminderTimes: Record<string, string>;
    };

    // Create habits
    if (habits && habits.length > 0) {
      const habitsToInsert = habits.map((habit) => ({
        userId,
        name: habit.name,
        type: 'good' as const,
        category: habit.category,
        icon: habit.icon,
        color: '#059669',
        frequency: 'daily' as const,
        targetPerDay: 1,
        isActive: true,
        reminderEnabled: !!habit.reminderTime,
        reminderTime: habit.reminderTime,
      }));

      console.log('Inserting habits for onboarding:', habitsToInsert.length);
      try {
        await db.insert(habitsTable).values(habitsToInsert);
      } catch (habitsError: any) {
        console.error('Error creating habits during onboarding:', habitsError);
        return NextResponse.json(
          { error: 'Failed to create habits', details: habitsError.message },
          { status: 500 }
        );
      }
    }

    // Mark onboarding as completed
    console.log('Marking onboarding as completed for user:', userId);
    try {
      await db
        .update(users)
        .set({ onboardingCompleted: true })
        .where(eq(users.id, userId));
    } catch (profileError: any) {
      console.error('Error updating profile during onboarding:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: profileError.message },
        { status: 500 }
      );
    }

    console.log('Onboarding completed successfully for user:', userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in onboarding complete route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

