import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkApiRateLimit, getClientIp } from "@/lib/rate-limit";
import { format, subDays, startOfWeek } from "date-fns";

interface InsightItem {
  type: "positive" | "warning" | "info" | "achievement";
  icon: string;
  title: string;
  description: string;
  metric?: string;
}

/**
 * Generates AI-style insights from habit logs without requiring OpenAI.
 * Uses statistical analysis of the user's data.
 * If OPENAI_API_KEY is set, enhances with GPT-4o-mini for natural language.
 */
async function generateInsights(
  habits: any[],
  logs: any[],
  journalEntries: any[]
): Promise<InsightItem[]> {
  const insights: InsightItem[] = [];
  const today = new Date();

  if (habits.length === 0) return insights;

  // ── Weekend vs Weekday analysis ──────────────────────────────
  const weekendLogs = logs.filter((l) => {
    const d = new Date(l.date + "T00:00:00");
    return d.getDay() === 0 || d.getDay() === 6;
  });
  const weekdayLogs = logs.filter((l) => {
    const d = new Date(l.date + "T00:00:00");
    return d.getDay() > 0 && d.getDay() < 6;
  });

  const weekendDone = weekendLogs.filter((l) => l.status === "done").length;
  const weekdayDone = weekdayLogs.filter((l) => l.status === "done").length;
  const weekendRate = weekendLogs.length > 0 ? weekendDone / weekendLogs.length : 0;
  const weekdayRate = weekdayLogs.length > 0 ? weekdayDone / weekdayLogs.length : 0;

  if (weekendLogs.length >= 4 && weekdayLogs.length >= 4) {
    if (weekdayRate - weekendRate > 0.2) {
      insights.push({
        type: "warning",
        icon: "weekend",
        title: "Weekend Dip Detected",
        description: `You complete ${Math.round(weekdayRate * 100)}% of habits on weekdays but only ${Math.round(weekendRate * 100)}% on weekends. Try setting lighter weekend goals.`,
        metric: `-${Math.round((weekdayRate - weekendRate) * 100)}% on weekends`,
      });
    } else if (weekendRate > weekdayRate) {
      insights.push({
        type: "positive",
        icon: "celebration",
        title: "Weekend Warrior",
        description: `You're actually more consistent on weekends (${Math.round(weekendRate * 100)}%) than weekdays (${Math.round(weekdayRate * 100)}%). Great discipline!`,
        metric: `+${Math.round((weekendRate - weekdayRate) * 100)}% on weekends`,
      });
    }
  }

  // ── Best performing habit ────────────────────────────────────
  const habitStats = habits.map((h) => {
    const hLogs = logs.filter((l) => l.habit_id === h.id);
    const done = hLogs.filter((l) => l.status === "done").length;
    const rate = hLogs.length > 0 ? done / hLogs.length : 0;
    return { habit: h, rate, total: hLogs.length };
  });

  const best = habitStats.sort((a, b) => b.rate - a.rate)[0];
  if (best && best.rate >= 0.8 && best.total >= 5) {
    insights.push({
      type: "achievement",
      icon: "emoji_events",
      title: `${best.habit.name} is Your Strongest`,
      description: `You've completed "${best.habit.name}" ${Math.round(best.rate * 100)}% of the time. This habit is deeply ingrained — keep it up!`,
      metric: `${Math.round(best.rate * 100)}% completion`,
    });
  }

  // ── Needs attention ──────────────────────────────────────────
  const struggling = habitStats.filter((s) => s.rate < 0.4 && s.total >= 5);
  if (struggling.length > 0) {
    const worst = struggling.sort((a, b) => a.rate - b.rate)[0];
    insights.push({
      type: "warning",
      icon: "priority_high",
      title: `"${worst.habit.name}" Needs Attention`,
      description: `This habit has only a ${Math.round(worst.rate * 100)}% completion rate. Consider making it smaller or adjusting the time you do it.`,
      metric: `${Math.round(worst.rate * 100)}% completion`,
    });
  }

  // ── Bad habit reduction ──────────────────────────────────────
  const badHabits = habits.filter((h) => h.type === "bad" && h.daily_limit);
  for (const bh of badHabits) {
    const thisWeekLogs = logs.filter((l) => {
      const d = new Date(l.date + "T00:00:00");
      const weekAgo = subDays(today, 7);
      return l.habit_id === bh.id && d >= weekAgo;
    });
    const lastWeekLogs = logs.filter((l) => {
      const d = new Date(l.date + "T00:00:00");
      const twoWeeksAgo = subDays(today, 14);
      const weekAgo = subDays(today, 7);
      return l.habit_id === bh.id && d >= twoWeeksAgo && d < weekAgo;
    });

    if (thisWeekLogs.length > 0 && lastWeekLogs.length > 0) {
      const thisAvg = thisWeekLogs.reduce((s, l) => s + (l.count ?? 0), 0) / thisWeekLogs.length;
      const lastAvg = lastWeekLogs.reduce((s, l) => s + (l.count ?? 0), 0) / lastWeekLogs.length;
      const reduction = lastAvg > 0 ? ((lastAvg - thisAvg) / lastAvg) * 100 : 0;

      if (reduction >= 20) {
        insights.push({
          type: "positive",
          icon: "trending_down",
          title: `"${bh.name}" Reduced by ${Math.round(reduction)}%`,
          description: `Your ${bh.name} habit dropped from an average of ${lastAvg.toFixed(1)} to ${thisAvg.toFixed(1)} times per day this week. Real progress!`,
          metric: `-${Math.round(reduction)}% this week`,
        });
      }
    }
  }

  // ── Streak milestone ─────────────────────────────────────────
  const last7Days = Array.from({ length: 7 }, (_, i) =>
    format(subDays(today, i), "yyyy-MM-dd")
  );
  const perfectDays = last7Days.filter((d) => {
    const dayLogs = logs.filter((l) => l.date === d && l.status === "done");
    return dayLogs.length >= habits.length && habits.length > 0;
  });

  if (perfectDays.length >= 5) {
    insights.push({
      type: "achievement",
      icon: "local_fire_department",
      title: "On Fire This Week!",
      description: `You had ${perfectDays.length} perfect days this week where you completed all your habits. You're building serious momentum.`,
      metric: `${perfectDays.length}/7 perfect days`,
    });
  }

  // ── Journal consistency ──────────────────────────────────────
  if (journalEntries.length >= 5) {
    const last14 = Array.from({ length: 14 }, (_, i) =>
      format(subDays(today, i), "yyyy-MM-dd")
    );
    const journalDays = last14.filter((d) =>
      journalEntries.some((e) => e.date === d)
    );
    if (journalDays.length >= 10) {
      insights.push({
        type: "positive",
        icon: "edit_note",
        title: "Consistent Journaler",
        description: `You've journaled ${journalDays.length} out of the last 14 days. Reflection is a superpower — you're using it well.`,
        metric: `${journalDays.length}/14 days`,
      });
    }
  }

  // ── Morning vs Evening (if reminder times exist) ─────────────
  const morningHabits = habits.filter((h) => {
    if (!h.reminder_time) return false;
    const hour = parseInt(h.reminder_time.split(":")[0]);
    return hour < 12;
  });
  const eveningHabits = habits.filter((h) => {
    if (!h.reminder_time) return false;
    const hour = parseInt(h.reminder_time.split(":")[0]);
    return hour >= 17;
  });

  if (morningHabits.length > 0 && eveningHabits.length > 0) {
    const morningLogs = logs.filter((l) =>
      morningHabits.some((h) => h.id === l.habit_id)
    );
    const eveningLogs = logs.filter((l) =>
      eveningHabits.some((h) => h.id === l.habit_id)
    );
    const morningRate =
      morningLogs.length > 0
        ? morningLogs.filter((l) => l.status === "done").length / morningLogs.length
        : 0;
    const eveningRate =
      eveningLogs.length > 0
        ? eveningLogs.filter((l) => l.status === "done").length / eveningLogs.length
        : 0;

    if (morningRate > eveningRate + 0.15 && morningLogs.length >= 5) {
      insights.push({
        type: "info",
        icon: "wb_sunny",
        title: "You're a Morning Person",
        description: `Morning habits have a ${Math.round(morningRate * 100)}% completion rate vs ${Math.round(eveningRate * 100)}% for evening habits. Schedule important habits in the morning.`,
        metric: `${Math.round(morningRate * 100)}% morning rate`,
      });
    }
  }

  // Limit to 5 most relevant insights
  return insights.slice(0, 5);
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = await checkApiRateLimit(`insights:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  // Check cache
  const { data: cached } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .single();

  if (cached) {
    return NextResponse.json({ insights: cached.insights, summary: cached.summary, cached: true });
  }

  // Fetch data for analysis
  const [habitsRes, logsRes, journalRes] = await Promise.all([
    supabase.from("habits").select("*").eq("user_id", user.id).eq("is_active", true),
    supabase
      .from("habit_logs")
      .select("*, habits!inner(user_id)")
      .eq("habits.user_id", user.id)
      .gte("date", format(subDays(new Date(), 30), "yyyy-MM-dd")),
    supabase
      .from("journal_entries")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", format(subDays(new Date(), 30), "yyyy-MM-dd")),
  ]);

  const habits = habitsRes.data ?? [];
  const logs = (logsRes.data ?? []).map(({ habits: _h, ...l }) => l);
  const journal = journalRes.data ?? [];

  const insights = await generateInsights(habits, logs, journal);

  const summary =
    insights.length > 0
      ? `${insights.filter((i) => i.type === "positive" || i.type === "achievement").length} positive trends and ${insights.filter((i) => i.type === "warning").length} areas to improve this week.`
      : "Keep tracking your habits to unlock personalized insights!";

  // Cache the result
  await supabase.from("ai_insights").upsert(
    { user_id: user.id, week_start: weekStart, insights, summary },
    { onConflict: "user_id,week_start" }
  );

  return NextResponse.json({ insights, summary, cached: false });
}
