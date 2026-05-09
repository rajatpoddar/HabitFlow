import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { checkAdminRateLimit, getClientIp } from "@/lib/rate-limit";
import { format, subDays } from "date-fns";
import { db } from "@/lib/db";
import { users, habits, habitLogs } from "@/lib/db/schema";
import { count, eq, gte, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = await checkAdminRateLimit(`admin-stats:${ip}`);
  if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  // Verify caller is admin
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const dayAgo = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const [
    totalUsersRes,
    proUsersRes,
    activeDailyRes,
    totalHabitsRes,
    logsWeekRes,
    topCategoriesRes,
    trendLogsRes,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(users).where(eq(users.plan, "pro")),
    // For habit logs within last day
    db.select({ count: count() }).from(habitLogs).where(gte(habitLogs.date, dayAgo)),
    // Active habits
    db.select({ count: count() }).from(habits).where(eq(habits.isActive, true)),
    // Logs within last week
    db.select({ count: count() }).from(habitLogs).where(gte(habitLogs.date, weekAgo)),
    // Top categories
    db.select({ category: habits.category }).from(habits).where(eq(habits.isActive, true)),
    // Trend logs (all done logs in last 7 days)
    db.select({ date: habitLogs.date }).from(habitLogs).where(and(eq(habitLogs.status, "done"), gte(habitLogs.date, weekAgo))),
  ]);

  // Active weekly: distinct users
  const activeWeeklyData = await db
    .select({ userId: habits.userId })
    .from(habitLogs)
    .innerJoin(habits, eq(habitLogs.habitId, habits.id))
    .where(gte(habitLogs.date, weekAgo));
  
  const activeWeeklyUserIds = new Set(
    activeWeeklyData.map((r: any) => r.userId).filter(Boolean)
  );

  // Compute top categories
  const categoryMap: Record<string, number> = {};
  for (const h of topCategoriesRes) {
    categoryMap[h.category] = (categoryMap[h.category] ?? 0) + 1;
  }
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, categoryCount]) => ({ name, count: categoryCount }));

  // Build 7-day trend
  const trendDays = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), "yyyy-MM-dd"));
  const trendCountMap: Record<string, number> = {};
  for (const row of trendLogsRes) {
    trendCountMap[row.date] = (trendCountMap[row.date] ?? 0) + 1;
  }
  const completionTrend = trendDays.map((date) => ({ date, completions: trendCountMap[date] ?? 0 }));

  return NextResponse.json({
    totalUsers: totalUsersRes[0].count ?? 0,
    proUsers: proUsersRes[0].count ?? 0,
    bannedUsers: 0, // is_banned column not in users table yet
    activeWeekly: activeWeeklyUserIds.size,
    activeDaily: activeDailyRes[0].count ?? 0,
    totalHabits: totalHabitsRes[0].count ?? 0,
    logsThisWeek: logsWeekRes[0].count ?? 0,
    topCategories,
    completionTrend,
  });
}
