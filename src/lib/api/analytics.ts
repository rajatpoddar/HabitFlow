import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import type { Habit, HabitLog, DailyStats, HabitStats, WeeklyData, HeatmapCell, BadHabitDayStats, BadHabitWeeklyTrend } from "@/types";
import { calculateStreak } from "./habits";

// ─── Daily Completion ─────────────────────────────────────────────────────────

export function getDailyStats(
  habits: Habit[],
  logs: HabitLog[],
  date: Date
): DailyStats {
  const dateStr = format(date, "yyyy-MM-dd");
  const dayLogs = logs.filter((l) => l.date === dateStr);
  const completed = dayLogs.filter((l) => l.status === "done").length;
  const total = habits.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { date: dateStr, total, completed, percentage };
}

// ─── Weekly Data ──────────────────────────────────────────────────────────────

export function getWeeklyData(
  habits: Habit[],
  logs: HabitLog[],
  referenceDate: Date = new Date()
): WeeklyData[] {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayLogs = logs.filter((l) => l.date === dateStr);
    const completed = dayLogs.filter((l) => l.status === "done").length;
    const total = habits.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      day: format(day, "EEE"),
      completed,
      total,
      percentage,
    };
  });
}

// ─── Habit Stats ──────────────────────────────────────────────────────────────

export function getHabitStats(habit: Habit, logs: HabitLog[]): HabitStats {
  const habitLogs = logs.filter((l) => l.habit_id === habit.id);
  const doneLogs = habitLogs.filter((l) => l.status === "done");
  const totalCompleted = doneLogs.length;
  const completionRate =
    habitLogs.length > 0
      ? Math.round((totalCompleted / habitLogs.length) * 100)
      : 0;

  const { current, longest } = calculateStreak(habitLogs);

  return {
    habit,
    completionRate,
    currentStreak: current,
    longestStreak: longest,
    totalCompleted,
  };
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

export function getHeatmapData(
  habits: Habit[],
  logs: HabitLog[],
  weeks = 12
): HeatmapCell[] {
  const today = new Date();
  const start = subDays(today, weeks * 7 - 1);
  const days = eachDayOfInterval({ start, end: today });

  return days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayLogs = logs.filter(
      (l) => l.date === dateStr && l.status === "done"
    );
    const count = dayLogs.length;
    const total = habits.length;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (total > 0 && count > 0) {
      const pct = count / total;
      if (pct >= 0.9) level = 4;
      else if (pct >= 0.6) level = 3;
      else if (pct >= 0.3) level = 2;
      else level = 1;
    }

    return { date: dateStr, count, level };
  });
}

// ─── Overall Streak ───────────────────────────────────────────────────────────

export function getOverallStreak(
  habits: Habit[],
  logs: HabitLog[]
): { current: number; longest: number } {
  if (habits.length === 0) return { current: 0, longest: 0 };

  const today = new Date();
  let current = 0;
  let longest = 0;
  let streak = 0;

  // Go back up to 365 days
  for (let i = 0; i < 365; i++) {
    const day = subDays(today, i);
    const dateStr = format(day, "yyyy-MM-dd");
    const dayLogs = logs.filter(
      (l) => l.date === dateStr && l.status === "done"
    );
    const allDone = dayLogs.length >= habits.length;

    if (allDone) {
      streak++;
      if (i === 0 || i === 1) current = streak; // today or yesterday
      if (streak > longest) longest = streak;
    } else {
      if (i > 1 && current === 0) break; // streak broken before today
      streak = 0;
    }
  }

  return { current, longest };
}

// ─── Good vs Bad Habit Comparison ────────────────────────────────────────────

export function getGoodVsBadStats(
  habits: Habit[],
  logs: HabitLog[]
): {
  goodCompletionRate: number;
  badControlRate: number;
  goodHabits: number;
  badHabits: number;
} {
  const goodHabits = habits.filter((h) => h.type === "good");
  const badHabits = habits.filter((h) => h.type === "bad");

  const goodLogs = logs.filter((l) =>
    goodHabits.some((h) => h.id === l.habit_id)
  );
  const badLogs = logs.filter((l) =>
    badHabits.some((h) => h.id === l.habit_id)
  );

  const goodDone = goodLogs.filter((l) => l.status === "done").length;
  const badDone = badLogs.filter((l) => l.status === "done").length; // "done" for bad = avoided

  const goodCompletionRate =
    goodLogs.length > 0 ? Math.round((goodDone / goodLogs.length) * 100) : 0;
  const badControlRate =
    badLogs.length > 0 ? Math.round((badDone / badLogs.length) * 100) : 0;

  return {
    goodCompletionRate,
    badControlRate,
    goodHabits: goodHabits.length,
    badHabits: badHabits.length,
  };
}

// ─── Bad Habit Day Stats ──────────────────────────────────────────────────────

export function getBadHabitDayStats(
  habit: Habit,
  logs: HabitLog[],
  date: Date
): BadHabitDayStats {
  const dateStr = format(date, "yyyy-MM-dd");
  const log = logs.find((l) => l.habit_id === habit.id && l.date === dateStr);
  const count = log?.count ?? 0;
  const limit = habit.daily_limit ?? 0;
  const avoided = limit > 0 ? Math.max(0, limit - count) : 0;
  const avoidanceRate = limit > 0 ? Math.round((avoided / limit) * 100) : 0;

  // Compare with yesterday
  const yesterday = subDays(date, 1);
  const yesterdayStr = format(yesterday, "yyyy-MM-dd");
  const yesterdayLog = logs.find(
    (l) => l.habit_id === habit.id && l.date === yesterdayStr
  );
  const yesterdayCount = yesterdayLog?.count ?? 0;

  let status: "improving" | "same" | "worse" = "same";
  if (count < yesterdayCount) status = "improving";
  else if (count > yesterdayCount) status = "worse";

  return { habitId: habit.id, date: dateStr, count, limit, avoided, avoidanceRate, status };
}

// ─── Bad Habit Weekly Trend ───────────────────────────────────────────────────

export function getBadHabitWeeklyTrend(
  habit: Habit,
  logs: HabitLog[],
  referenceDate: Date = new Date()
): BadHabitWeeklyTrend[] {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const limit = habit.daily_limit ?? 0;

  return days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const log = logs.find((l) => l.habit_id === habit.id && l.date === dateStr);
    const count = log?.count ?? 0;
    const avoided = limit > 0 ? Math.max(0, limit - count) : 0;
    const avoidanceRate = limit > 0 ? Math.round((avoided / limit) * 100) : 0;

    return {
      day: format(day, "EEE"),
      count,
      limit,
      avoidanceRate,
    };
  });
}

// ─── Bad Habit Improvement Score ─────────────────────────────────────────────

export function getBadHabitImprovementScore(
  habit: Habit,
  logs: HabitLog[],
  days = 7
): number {
  if (!habit.daily_limit) return 0;
  const today = new Date();
  const limit = habit.daily_limit;
  let totalAvoidance = 0;
  let daysWithData = 0;

  for (let i = 0; i < days; i++) {
    const day = subDays(today, i);
    const dateStr = format(day, "yyyy-MM-dd");
    const log = logs.find((l) => l.habit_id === habit.id && l.date === dateStr);
    if (log) {
      const avoided = Math.max(0, limit - (log.count ?? 0));
      totalAvoidance += avoided / limit;
      daysWithData++;
    }
  }

  return daysWithData > 0 ? Math.round((totalAvoidance / daysWithData) * 100) : 0;
}
