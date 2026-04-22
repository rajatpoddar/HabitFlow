import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/api/admin";
import { checkAdminRateLimit, getClientIp } from "@/lib/rate-limit";
import { format, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = await checkAdminRateLimit(`admin-stats:${ip}`);
  if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  // Verify caller is admin via session client
  const sessionClient = createSupabaseServerClient();
  const admin = await requireAdmin(sessionClient);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Use service-role client for all data queries — bypasses RLS, no recursion
  const supabase = createSupabaseAdminClient();

  const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const dayAgo = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const [
    totalUsersRes,
    proUsersRes,
    bannedUsersRes,
    activeDailyRes,
    totalHabitsRes,
    logsWeekRes,
    topCategoriesRes,
    // Single query for 7-day trend — batch instead of 7 round trips
    trendLogsRes,
  ] = await Promise.all([
    supabase.from("user_profiles").select("*", { count: "exact", head: true }),
    supabase.from("user_profiles").select("*", { count: "exact", head: true }).eq("plan", "pro"),
    supabase.from("user_profiles").select("*", { count: "exact", head: true }).eq("is_banned", true),
    supabase.from("habit_logs").select("habits!inner(user_id)", { count: "exact", head: true }).gte("date", dayAgo),
    supabase.from("habits").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("habit_logs").select("*", { count: "exact", head: true }).gte("date", weekAgo),
    supabase.from("habits").select("category").eq("is_active", true),
    // Fetch all done logs for last 7 days in ONE query, aggregate in memory
    supabase.from("habit_logs").select("date").eq("status", "done").gte("date", weekAgo),
  ]);

  // Active weekly: count distinct users who logged in last 7 days
  const { data: activeWeeklyData } = await supabase
    .from("habit_logs")
    .select("habits!inner(user_id)")
    .gte("date", weekAgo);
  const activeWeeklyUserIds = new Set(
    (activeWeeklyData ?? []).map((r: any) => r.habits?.user_id).filter(Boolean)
  );

  // Compute top categories
  const categoryMap: Record<string, number> = {};
  for (const h of topCategoriesRes.data ?? []) {
    categoryMap[h.category] = (categoryMap[h.category] ?? 0) + 1;
  }
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Build 7-day trend from single batch query
  const trendDays = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), "yyyy-MM-dd"));
  const trendCountMap: Record<string, number> = {};
  for (const row of trendLogsRes.data ?? []) {
    trendCountMap[row.date] = (trendCountMap[row.date] ?? 0) + 1;
  }
  const completionTrend = trendDays.map((date) => ({ date, completions: trendCountMap[date] ?? 0 }));

  return NextResponse.json({
    totalUsers: totalUsersRes.count ?? 0,
    proUsers: proUsersRes.count ?? 0,
    bannedUsers: bannedUsersRes.count ?? 0,
    activeWeekly: activeWeeklyUserIds.size,
    activeDaily: activeDailyRes.count ?? 0,
    totalHabits: totalHabitsRes.count ?? 0,
    logsThisWeek: logsWeekRes.count ?? 0,
    topCategories,
    completionTrend,
  });
}
