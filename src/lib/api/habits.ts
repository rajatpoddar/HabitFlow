import { db } from "@/lib/db";
import { habits, habitLogs } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import type { Habit, HabitLog, LogStatus } from "@/types";
import { format } from "date-fns";

// ─── Habits ───────────────────────────────────────────────────────────────────

export async function getHabits(userId: string): Promise<Habit[]> {
  const data = await db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.isActive, true)))
    .orderBy(asc(habits.createdAt));

  return data.map(h => ({
    ...h,
    user_id: h.userId,
    target_per_day: h.targetPerDay,
    is_active: h.isActive,
    reminder_time: h.reminderTime,
    reminder_enabled: h.reminderEnabled,
    daily_limit: h.dailyLimit,
    created_at: h.createdAt.toISOString(),
    updated_at: h.updatedAt.toISOString(),
  })) as unknown as Habit[];
}

export async function createHabit(data: any): Promise<Habit> {
  const [record] = await db.insert(habits).values({
    userId: data.user_id,
    name: data.name,
    type: data.type,
    category: data.category || "Health",
    icon: data.icon || "check_circle",
    color: data.color || "#005237",
    frequency: data.frequency || "daily",
    targetPerDay: data.target_per_day || 1,
    isActive: true,
    reminderTime: data.reminder_time,
    reminderEnabled: data.reminder_enabled || false,
    dailyLimit: data.daily_limit,
  }).returning();

  return {
    ...record,
    user_id: record.userId,
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString(),
  } as unknown as Habit;
}

export async function updateHabit(id: string, data: any): Promise<Habit> {
  const [record] = await db
    .update(habits)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(habits.id, id))
    .returning();

  return {
    ...record,
    user_id: record.userId,
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString(),
  } as unknown as Habit;
}

export async function deleteHabit(id: string): Promise<void> {
  await db
    .update(habits)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(habits.id, id));
}

// ─── Habit Logs ───────────────────────────────────────────────────────────────

export async function getLogsForUser(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<HabitLog[]> {
  const query = db
    .select({
      id: habitLogs.id,
      habit_id: habitLogs.habitId,
      date: habitLogs.date,
      status: habitLogs.status,
      count: habitLogs.count,
      created_at: habitLogs.createdAt,
      updated_at: habitLogs.updatedAt,
    })
    .from(habitLogs)
    .innerJoin(habits, eq(habitLogs.habitId, habits.id))
    .where(eq(habits.userId, userId))
    .orderBy(desc(habitLogs.date));

  // Note: Filtering by date string is fine as it's YYYY-MM-DD
  const results = await query;
  
  let filtered = results;
  if (startDate) filtered = filtered.filter(l => l.date >= startDate);
  if (endDate) filtered = filtered.filter(l => l.date <= endDate);

  return filtered.map(l => ({
    ...l,
    created_at: l.created_at.toISOString(),
    updated_at: l.updated_at.toISOString(),
  })) as unknown as HabitLog[];
}

export async function toggleHabitLog(
  habitId: string,
  date: Date,
  _currentStatus: LogStatus | null
): Promise<HabitLog | null> {
  const dateStr = format(date, "yyyy-MM-dd");

  const [existing] = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, dateStr)))
    .limit(1);

  if (existing) {
    if (existing.status === "done") {
      await db.delete(habitLogs).where(eq(habitLogs.id, existing.id));
      return null;
    } else {
      const [updated] = await db
        .update(habitLogs)
        .set({ status: "done", updatedAt: new Date() })
        .where(eq(habitLogs.id, existing.id))
        .returning();
      return {
        ...updated,
        habit_id: updated.habitId,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      } as unknown as HabitLog;
    }
  } else {
    const [inserted] = await db.insert(habitLogs).values({
      habitId,
      date: dateStr,
      status: "done",
      count: 0,
    }).returning();
    return {
      ...inserted,
      habit_id: inserted.habitId,
      created_at: inserted.createdAt.toISOString(),
      updated_at: inserted.updatedAt.toISOString(),
    } as unknown as HabitLog;
  }
}

export async function updateBadHabitCount(
  habitId: string,
  date: Date,
  delta: 1 | -1
): Promise<HabitLog> {
  const dateStr = format(date, "yyyy-MM-dd");

  const [existing] = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, dateStr)))
    .limit(1);

  if (existing) {
    const newCount = Math.max(0, (existing.count ?? 0) + delta);
    const [updated] = await db
      .update(habitLogs)
      .set({ count: newCount, status: "done", updatedAt: new Date() })
      .where(eq(habitLogs.id, existing.id))
      .returning();
    return {
      ...updated,
      habit_id: updated.habitId,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    } as unknown as HabitLog;
  } else {
    const newCount = Math.max(0, delta);
    const [inserted] = await db.insert(habitLogs).values({
      habitId,
      date: dateStr,
      status: "done",
      count: newCount,
    }).returning();
    return {
      ...inserted,
      habit_id: inserted.habitId,
      created_at: inserted.createdAt.toISOString(),
      updated_at: inserted.updatedAt.toISOString(),
    } as unknown as HabitLog;
  }
}

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
      return true;
    default:
      return true;
  }
}

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
