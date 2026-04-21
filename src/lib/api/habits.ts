import { supabase } from "@/lib/supabase";
import type { Habit, HabitLog, LogStatus } from "@/types";
import { format } from "date-fns";

// ─── Habits ───────────────────────────────────────────────────────────────────

export async function getHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as Habit[];
}

export async function createHabit(
  data: Omit<Habit, "id" | "created_at" | "updated_at">
): Promise<Habit> {
  const { data: record, error } = await supabase
    .from("habits")
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return record as Habit;
}

export async function updateHabit(
  id: string,
  data: Partial<Omit<Habit, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<Habit> {
  const { data: record, error } = await supabase
    .from("habits")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return record as Habit;
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase
    .from("habits")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ─── Habit Logs ───────────────────────────────────────────────────────────────

export async function getLogsForUser(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<HabitLog[]> {
  let query = supabase
    .from("habit_logs")
    .select("*, habits!inner(user_id)")
    .eq("habits.user_id", userId)
    .order("date", { ascending: false });

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Strip the joined habits column — keep only log fields
  return (data || []).map(({ habits: _h, ...log }) => log) as HabitLog[];
}

export async function toggleHabitLog(
  habitId: string,
  date: Date,
  _currentStatus: LogStatus | null
): Promise<HabitLog | null> {
  const dateStr = format(date, "yyyy-MM-dd");

  // Check for existing log
  const { data: existing } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("habit_id", habitId)
    .eq("date", dateStr)
    .maybeSingle();

  if (existing) {
    if (existing.status === "done") {
      // Un-toggle: delete the log
      await supabase.from("habit_logs").delete().eq("id", existing.id);
      return null;
    } else {
      // Was missed → mark done
      const { data, error } = await supabase
        .from("habit_logs")
        .update({ status: "done" })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as HabitLog;
    }
  } else {
    // Create new done log
    const { data, error } = await supabase
      .from("habit_logs")
      .insert({ habit_id: habitId, date: dateStr, status: "done", count: 0 })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as HabitLog;
  }
}

/**
 * Increment or decrement the usage count for a bad habit log.
 * Creates the log if it doesn't exist yet.
 */
export async function updateBadHabitCount(
  habitId: string,
  date: Date,
  delta: 1 | -1
): Promise<HabitLog> {
  const dateStr = format(date, "yyyy-MM-dd");

  const { data: existing } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("habit_id", habitId)
    .eq("date", dateStr)
    .maybeSingle();

  if (existing) {
    const newCount = Math.max(0, (existing.count ?? 0) + delta);
    const { data, error } = await supabase
      .from("habit_logs")
      .update({ count: newCount, status: "done" })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as HabitLog;
  } else {
    const newCount = Math.max(0, delta);
    const { data, error } = await supabase
      .from("habit_logs")
      .insert({ habit_id: habitId, date: dateStr, status: "done", count: newCount })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as HabitLog;
  }
}

// ─── Streak Calculation ───────────────────────────────────────────────────────

export function calculateStreak(logs: HabitLog[]): {
  current: number;
  longest: number;
} {
  if (!logs.length) return { current: 0, longest: 0 };

  const doneDates = Array.from(
    new Set(logs.filter((l) => l.status === "done").map((l) => l.date))
  ).sort().reverse();

  if (!doneDates.length) return { current: 0, longest: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let current = 0;
  let longest = 0;
  let streak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of doneDates) {
    const date = new Date(dateStr + "T00:00:00");

    if (!prevDate) {
      const diff = Math.floor((today.getTime() - date.getTime()) / 86400000);
      streak = 1;
      if (diff <= 1) current = 1;
    } else {
      const diff = Math.floor(
        (prevDate.getTime() - date.getTime()) / 86400000
      );
      if (diff === 1) {
        streak++;
        if (current > 0) current = streak;
      } else {
        if (streak > longest) longest = streak;
        streak = 1;
      }
    }
    if (streak > longest) longest = streak;
    prevDate = date;
  }

  return { current, longest };
}
