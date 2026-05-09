import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { checkAdminRateLimit, getClientIp } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { users, habits, habitLogs } from "@/lib/db/schema";
import { count, eq, gte, ilike, or, inArray, desc, and } from "drizzle-orm";
import { format, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = await checkAdminRateLimit(`admin-users:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Verify caller is admin
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const plan = searchParams.get("plan") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = (page - 1) * limit;

  // Build the query conditions
  const conditions = [];
  if (plan) {
    conditions.push(eq(users.plan, plan as any));
  }
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(users.name, searchPattern),
        ilike(users.email, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 
    ? (conditions.length === 1 ? conditions[0] : and(...conditions)) 
    : undefined;

  // Fetch count
  const countRes = await db
    .select({ count: count() })
    .from(users)
    .where(whereClause);
    
  const totalCount = countRes[0].count;

  if (totalCount === 0) {
    return NextResponse.json({
      users: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    });
  }

  // Fetch paginated users
  const pagedUsers = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const userIds = pagedUsers.map(u => u.id);

  // Get habit counts for each user
  const userHabits = await db
    .select({ userId: habits.userId, id: habits.id })
    .from(habits)
    .where(and(inArray(habits.userId, userIds), eq(habits.isActive, true)));

  const habitCounts = new Map<string, number>();
  const habitToUserMap = new Map<string, string>();
  for (const habit of userHabits) {
    habitCounts.set(habit.userId, (habitCounts.get(habit.userId) || 0) + 1);
    habitToUserMap.set(habit.id, habit.userId);
  }

  // Get logs count for last 7 days
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const habitIds = userHabits.map(h => h.id);

  let logsCount = new Map<string, number>();
  
  if (habitIds.length > 0) {
    const logs = await db
      .select({ habitId: habitLogs.habitId })
      .from(habitLogs)
      .where(
        and(
          inArray(habitLogs.habitId, habitIds),
          gte(habitLogs.date, sevenDaysAgo)
        )
      );

    for (const log of logs) {
      const userId = habitToUserMap.get(log.habitId);
      if (userId) {
        logsCount.set(userId, (logsCount.get(userId) || 0) + 1);
      }
    }
  }

  // Transform to AdminUser format
  const resultUsers = pagedUsers.map((user) => ({
    id: user.id,
    email: user.email || "",
    created_at: user.createdAt,
    last_sign_in_at: user.updatedAt, // Approximate
    name: user.name,
    plan: user.plan,
    is_banned: user.isBanned,
    ban_reason: user.banReason,
    avatar_url: user.image,
    habit_count: habitCounts.get(user.id) || 0,
    logs_last_7_days: logsCount.get(user.id) || 0,
  }));

  return NextResponse.json({
    users: resultUsers,
    total: totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  });
}
