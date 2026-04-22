import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface HabitToCreate {
  name: string;
  icon: string;
  category: string;
  reminderTime: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { habits, reminderTimes } = body as {
      habits: HabitToCreate[];
      reminderTimes: Record<string, string>;
    };

    // Create habits
    if (habits && habits.length > 0) {
      const habitsToInsert = habits.map((habit) => ({
        user_id: user.id,
        name: habit.name,
        type: 'good' as const,
        category: habit.category,
        icon: habit.icon,
        color: '#059669',
        frequency: 'daily' as const,
        target_per_day: 1,
        is_active: true,
        reminder_enabled: !!habit.reminderTime,
        reminder_time: habit.reminderTime,
      }));

      const { error: habitsError } = await supabase
        .from('habits')
        .insert(habitsToInsert);

      if (habitsError) {
        console.error('Error creating habits:', habitsError);
        return NextResponse.json(
          { error: 'Failed to create habits' },
          { status: 500 }
        );
      }
    }

    // Mark onboarding as completed
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ onboarding_completed: true, onboarding_step: 4 })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in onboarding complete route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
