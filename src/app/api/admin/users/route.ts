import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/api/admin";
import { checkAdminRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = await checkAdminRateLimit(`admin-users:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Verify caller is admin via session client
  const sessionClient = createSupabaseServerClient();
  const admin = await requireAdmin(sessionClient);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Use service-role client for data queries — bypasses RLS
  const supabase = createSupabaseAdminClient();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const plan = searchParams.get("plan") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = (page - 1) * limit;

  // Get all users with their profiles
  let profilesQuery = supabase
    .from("user_profiles")
    .select("*", { count: "exact" });

  // Note: We'll filter by email after getting auth users
  if (plan) {
    profilesQuery = profilesQuery.eq("plan", plan);
  }

  const { data: profiles, error: profilesError, count } = await profilesQuery
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({
      users: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    });
  }

  // Get auth users for these profiles
  const { data: authUsers, error: authError } = await supabase
    .auth.admin.listUsers();

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Create a map of user_id -> auth user data
  const authUsersMap = new Map(
    authUsers.users.map((u) => [u.id, u])
  );

  // Filter profiles based on search (name or email)
  let filteredProfiles = profiles;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredProfiles = profiles.filter((profile) => {
      const authUser = authUsersMap.get(profile.id);
      const nameMatch = profile.name?.toLowerCase().includes(searchLower);
      const emailMatch = authUser?.email?.toLowerCase().includes(searchLower);
      return nameMatch || emailMatch;
    });
  }

  // Get habit counts for each user
  const userIds = filteredProfiles.map((p) => p.id);
  const { data: habits } = await supabase
    .from("habits")
    .select("id, user_id, is_active")
    .in("user_id", userIds);

  const habitCounts = new Map<string, number>();
  if (habits) {
    for (const habit of habits) {
      if (habit.is_active !== false) {
        habitCounts.set(habit.user_id, (habitCounts.get(habit.user_id) || 0) + 1);
      }
    }
  }

  // Get logs count for last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = sevenDaysAgo.toISOString().split('T')[0];

  const { data: logs } = await supabase
    .from("habit_logs")
    .select("habit_id")
    .gte("date", dateStr);

  // Get habit IDs for logs
  const loggedHabitIds = logs?.map((l) => l.habit_id) || [];
  const logCounts = new Map<string, number>();

  if (loggedHabitIds.length > 0 && habits) {
    // Create habit_id -> user_id map
    const habitToUserMap = new Map<string, string>();
    for (const habit of habits) {
      habitToUserMap.set(habit.id, habit.user_id);
    }

    // Count logs per user
    for (const log of logs || []) {
      const userId = habitToUserMap.get(log.habit_id);
      if (userId) {
        logCounts.set(userId, (logCounts.get(userId) || 0) + 1);
      }
    }
  }

  // Transform to AdminUser format
  const users = filteredProfiles.map((profile) => {
    const authUser = authUsersMap.get(profile.id);

    return {
      id: profile.id,
      email: authUser?.email || "",
      created_at: authUser?.created_at || profile.created_at,
      last_sign_in_at: authUser?.last_sign_in_at || null,
      name: profile.name,
      plan: profile.plan,
      is_banned: profile.is_banned,
      ban_reason: profile.ban_reason,
      avatar_url: profile.avatar_url,
      habit_count: habitCounts.get(profile.id) || 0,
      logs_last_7_days: logCounts.get(profile.id) || 0,
    };
  });

  return NextResponse.json({
    users,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
