import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { format } from 'date-fns';

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
    const { habitId } = body;

    if (!habitId) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
        { status: 400 }
      );
    }

    // Get user profile to check streak freezes
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('streak_freezes, plan')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (profile.streak_freezes <= 0) {
      return NextResponse.json(
        { error: 'No streak freezes available' },
        { status: 400 }
      );
    }

    // Verify habit belongs to user
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id')
      .eq('id', habitId)
      .eq('user_id', user.id)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const today = format(new Date(), 'yyyy-MM-dd');

    // Check if already has a log for today
    const { data: existingLog } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('habit_id', habitId)
      .eq('date', today)
      .maybeSingle();

    if (existingLog) {
      return NextResponse.json(
        { error: 'Habit already completed or frozen today' },
        { status: 400 }
      );
    }

    // Create freeze log
    const { error: logError } = await supabase.from('habit_logs').insert({
      habit_id: habitId,
      date: today,
      status: 'done',
      count: 0,
      log_type: 'freeze',
    });

    if (logError) {
      console.error('Error creating freeze log:', logError);
      return NextResponse.json(
        { error: 'Failed to freeze streak' },
        { status: 500 }
      );
    }

    // Deduct one freeze
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ streak_freezes: profile.streak_freezes - 1 })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating streak freezes:', updateError);
      return NextResponse.json(
        { error: 'Failed to update streak freezes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      remaining: profile.streak_freezes - 1,
    });
  } catch (error) {
    console.error('Error in freeze streak route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
