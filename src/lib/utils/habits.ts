import type { Habit, HabitLog } from "@/types";

/**
 * Check if a habit is due today based on its frequency settings
 */
export function isHabitDueToday(habit: Habit, date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  switch (habit.frequency) {
    case 'daily':
      return true;

    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;

    case 'custom_days':
      if (!habit.custom_days || habit.custom_days.length === 0) return true;
      return habit.custom_days.includes(dayOfWeek);

    case 'times_per_week':
      // For times_per_week, the habit is always "due" - we just track completion count
      return true;

    default:
      return true;
  }
}

/**
 * Calculate the current and longest streak for a habit based on its logs
 */
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
