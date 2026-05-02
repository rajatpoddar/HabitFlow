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

      console.log('Inserting habits for onboarding:', habitsToInsert.length);
      const { error: habitsError } = await supabase
        .from('habits')
        .insert(habitsToInsert);

      if (habitsError) {
        console.error('Error creating habits during onboarding:', habitsError);
        return NextResponse.json(
          { error: 'Failed to create habits', details: habitsError.message },
          { status: 500 }
        );
      }
    }

    // Mark onboarding as completed
    console.log('Marking onboarding as completed for user:', user.id);
    const { data: updateData, error: profileError } = await supabase
      .from('user_profiles')
      .update({ onboarding_completed: true, onboarding_step: 4 })
      .eq('id', user.id)
      .select();

    if (profileError) {
      console.error('Error updating profile during onboarding:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: profileError.message },
        { status: 500 }
      );
    }

    if (!updateData || updateData.length === 0) {
      console.warn('No profile record found to update for user:', user.id);
      // If profile is missing, try to create it
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          onboarding_completed: true,
          onboarding_step: 4,
          plan: 'free'
        });

      if (insertError) {
        console.error('Error creating missing profile during onboarding:', insertError);
        return NextResponse.json(
          { error: 'Failed to create profile', details: insertError.message },
          { status: 500 }
        );
      }
    }

    console.log('Onboarding completed successfully for user:', user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in onboarding complete route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
