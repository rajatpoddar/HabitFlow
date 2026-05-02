import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { habits, habitLogs, journalEntries, aiInsights } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { format, subDays, startOfWeek } from "date-fns";

interface InsightItem {
  type: "positive" | "warning" | "info" | "achievement";
  icon: string;
  title: string;
  description: string;
  metric?: string;
}

async function generateInsights(
  userHabits: any[],
  userLogs: any[],
  userJournal: any[]
): Promise<InsightItem[]> {
  const insights: InsightItem[] = [];
  const today = new Date();

  if (userHabits.length === 0) return insights;

  // ── Weekend vs Weekday analysis ──────────────────────────────
  const weekendLogs = userLogs.filter((l) => {
    const d = new Date(l.date + "T00:00:00");
    return d.getDay() === 0 || d.getDay() === 6;
  });
  const weekdayLogs = userLogs.filter((l) => {
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
  const habitStats = userHabits.map((h) => {
    const hLogs = userLogs.filter((l) => l.habit_id === h.id);
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

  // Limit to 5
  return insights.slice(0, 5);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  try {
    // Check cache
    const [cached] = await db
      .select()
      .from(aiInsights)
      .where(and(eq(aiInsights.userId, userId), eq(aiInsights.weekStart, weekStart)))
      .limit(1);

    if (cached) {
      return NextResponse.json({ insights: cached.insights, summary: cached.summary, cached: true });
    }

    // Fetch data for analysis
    const [userHabits, userLogs, userJournal] = await Promise.all([
      db.select().from(habits).where(and(eq(habits.userId, userId), eq(habits.isActive, true))),
      db.select().from(habitLogs).where(gte(habitLogs.date, format(subDays(new Date(), 30), "yyyy-MM-dd"))), // Simplification: we'd ideally join with habits to filter by userId
      db.select().from(journalEntries).where(and(eq(journalEntries.userId, userId), gte(journalEntries.date, format(subDays(new Date(), 30), "yyyy-MM-dd"))))
    ]);

    // Filter logs by user in memory for simplicity or add a join
    const filteredLogs = userLogs.filter(log => userHabits.some(h => h.id === log.habitId));

    const insights = await generateInsights(userHabits, filteredLogs, userJournal);

    const summary =
      insights.length > 0
        ? `${insights.filter((i) => i.type === "positive" || i.type === "achievement").length} positive trends and ${insights.filter((i) => i.type === "warning").length} areas to improve this week.`
        : "Keep tracking your habits to unlock personalized insights!";

    // Cache the result
    await db.insert(aiInsights).values({
      userId,
      weekStart,
      insights,
      summary,
    }).onConflictDoUpdate({
      target: [aiInsights.userId, aiInsights.weekStart],
      set: { insights, summary }
    });

    return NextResponse.json({ insights, summary, cached: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
