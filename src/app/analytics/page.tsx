"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useStore } from "@/store/useStore";
import BottomNav from "@/components/ui/BottomNav";
import TopBar from "@/components/ui/TopBar";
import InsightsPanel from "@/components/insights/InsightsPanel";
import {
  getWeeklyData,
  getHeatmapData,
  getOverallStreak,
  getGoodVsBadStats,
  getHabitStats,
  getBadHabitDayStats,
  getBadHabitWeeklyTrend,
  getBadHabitImprovementScore,
} from "@/lib/api/analytics";

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, habits, logs, isLoading, checkAuth, fetchHabits, fetchLogs } = useStore();

  useEffect(() => {
    checkAuth().then(() => {
      const { user } = useStore.getState();
      if (!user) { router.push("/login"); return; }
      const start = format(subDays(new Date(), 90), "yyyy-MM-dd");
      Promise.all([fetchHabits(), fetchLogs(start)]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weeklyData = useMemo(() => getWeeklyData(habits, logs), [habits, logs]);

  const heatmapData = useMemo(() => getHeatmapData(habits, logs, 12), [habits, logs]);

  const { current: currentStreak, longest: longestStreak } = useMemo(
    () => getOverallStreak(habits, logs),
    [habits, logs]
  );

  const { goodCompletionRate, badControlRate } = useMemo(
    () => getGoodVsBadStats(habits, logs),
    [habits, logs]
  );

  const habitStats = useMemo(
    () =>
      habits
        .map((h) => getHabitStats(h, logs))
        .sort((a, b) => b.completionRate - a.completionRate),
    [habits, logs]
  );

  const topHabits = habitStats.filter((s) => s.habit.type === "good").slice(0, 3);
  const needsAttention = habitStats
    .filter((s) => s.habit.type === "good" && s.completionRate < 50)
    .slice(0, 3);

  // Bad habit analytics
  const badHabits = habits.filter((h) => h.type === "bad" && (h.daily_limit ?? 0) > 0);
  const today = new Date();

  const badHabitStats = useMemo(
    () =>
      badHabits.map((habit) => ({
        habit,
        dayStats: getBadHabitDayStats(habit, logs, today),
        weeklyTrend: getBadHabitWeeklyTrend(habit, logs, today),
        improvementScore: getBadHabitImprovementScore(habit, logs, 7),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [badHabits, logs]
  );

  const heatmapLevelColors = [
    "bg-surface-container-highest",
    "bg-primary/20",
    "bg-primary/40",
    "bg-primary/70",
    "bg-primary",
  ];

  const maxBar = Math.max(...weeklyData.map((d) => d.percentage), 1);

  return (
    <div className="min-h-screen bg-surface pb-28">
      <TopBar />

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-8">
        {/* Header */}
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-primary tracking-tight">
            Analytics
          </h2>
          <p className="font-body text-on-surface-variant mt-1">Your growth over time.</p>
        </div>

        {/* Weekly Overview */}
        <div className="bg-surface-container-low rounded-[2rem] p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-headline text-xl font-bold text-primary">Weekly Overview</h3>
              <p className="font-body text-on-surface-variant text-sm mt-1">
                Consistency score:{" "}
                {weeklyData.length > 0
                  ? Math.round(weeklyData.reduce((a, b) => a + b.percentage, 0) / weeklyData.length)
                  : 0}
                %
              </p>
            </div>
            <span
              className="material-symbols-outlined text-primary-fixed-dim text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bar_chart
            </span>
          </div>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barCategoryGap="20%">
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#3f4943", fontFamily: "Inter" }}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-surface-container-lowest rounded-xl px-3 py-2 shadow-ambient text-xs font-body">
                          <p className="font-semibold text-on-surface">{payload[0].payload.day}</p>
                          <p className="text-on-surface-variant">{payload[0].value}% complete</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.percentage === maxBar
                          ? "#6cf8ba"
                          : entry.percentage > 60
                          ? "#005237"
                          : entry.percentage > 0
                          ? "#006d4a"
                          : "#e0e3df"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Streak Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-high rounded-[1.5rem] p-6 flex flex-col items-center text-center">
            <span
              className="material-symbols-outlined text-4xl text-primary mb-2"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <h4 className="font-headline text-4xl font-extrabold text-primary tracking-tighter">
              {currentStreak}
            </h4>
            <p className="font-body text-sm text-on-surface-variant mt-1">Current Streak</p>
          </div>
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 flex flex-col items-center text-center shadow-ambient">
            <span className="material-symbols-outlined text-3xl text-secondary mb-2">emoji_events</span>
            <h4 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
              {longestStreak}
            </h4>
            <p className="font-body text-sm text-on-surface-variant mt-1">Longest Streak</p>
          </div>
        </div>

        {/* Good vs Bad */}
        <div className="bg-surface-container rounded-[2rem] p-6 space-y-4">
          <h3 className="font-headline text-xl font-bold text-on-surface">Habit Balance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                  <span className="font-body text-sm font-medium text-on-surface">Good Habits Completion</span>
                </div>
                <span className="font-headline font-bold text-primary">{goodCompletionRate}%</span>
              </div>
              <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${goodCompletionRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-sm">trending_down</span>
                  <span className="font-body text-sm font-medium text-on-surface">Bad Habits Control Rate</span>
                </div>
                <span className="font-headline font-bold text-tertiary">{badControlRate}%</span>
              </div>
              <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-tertiary rounded-full transition-all duration-700"
                  style={{ width: `${badControlRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bad Habit Insights */}
        {badHabitStats.length > 0 && (
          <section>
            <h3 className="font-headline text-xl font-bold text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-xl">insights</span>
              Reduction Insights
            </h3>
            <p className="font-body text-sm text-on-surface-variant mb-5">
              Every step toward reduction is a win. Keep going 💪
            </p>
            <div className="space-y-5">
              {badHabitStats.map(({ habit, dayStats, weeklyTrend, improvementScore }) => (
                <BadHabitCard
                  key={habit.id}
                  habitName={habit.name}
                  habitIcon={habit.icon}
                  dayStats={dayStats}
                  weeklyTrend={weeklyTrend}
                  improvementScore={improvementScore}
                />
              ))}
            </div>
          </section>
        )}

        {/* Heatmap */}
        <div className="bg-surface-container rounded-[2rem] p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-xl font-bold text-primary">Consistency Matrix</h3>
            <span className="material-symbols-outlined text-outline">calendar_month</span>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div className="flex flex-col justify-between text-xs font-label text-on-surface-variant py-1">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${Math.ceil(heatmapData.length / 7)}, 1fr)`,
                gridTemplateRows: "repeat(7, 1fr)",
                gridAutoFlow: "column",
              }}
            >
              {heatmapData.map((cell, i) => (
                <div
                  key={i}
                  title={`${cell.date}: ${cell.count} habits`}
                  className={`aspect-square rounded-sm ${heatmapLevelColors[cell.level]}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end items-center gap-2 mt-4 text-xs font-label text-on-surface-variant">
            <span>Less</span>
            {heatmapLevelColors.map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Top Habits */}
        {topHabits.length > 0 && (
          <section>
            <h3 className="font-headline text-xl font-bold text-primary mb-5">Top Growing Habits</h3>
            <div className="space-y-4">
              {topHabits.map(({ habit, completionRate, currentStreak }) => (
                <div
                  key={habit.id}
                  className="bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-ambient"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-sm">{habit.icon}</span>
                      </div>
                      <div>
                        <span className="font-body font-medium text-on-surface">{habit.name}</span>
                        {currentStreak > 0 && (
                          <p className="font-body text-xs text-on-surface-variant">
                            🔥 {currentStreak} day streak
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-headline font-bold text-primary">{completionRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <section>
            <h3 className="font-headline text-xl font-bold text-tertiary mb-5 flex items-center gap-2">
              Needs Attention
              <span className="material-symbols-outlined text-sm">info</span>
            </h3>
            <div className="space-y-3">
              {needsAttention.map(({ habit, completionRate }) => (
                <div
                  key={habit.id}
                  className="bg-surface-container-low rounded-[1.5rem] p-4 flex justify-between items-center border border-outline-variant/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-tertiary" />
                    <div>
                      <h4 className="font-body font-medium text-on-surface">{habit.name}</h4>
                      <p className="font-label text-xs text-on-surface-variant mt-0.5">
                        {completionRate}% completion rate
                      </p>
                    </div>
                  </div>
                  <span className="font-body text-xs text-on-surface-variant bg-surface px-3 py-1.5 rounded-full">
                    Keep going 💪
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {habits.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">analytics</span>
            <p className="font-body text-on-surface-variant mt-4">Add some habits to see your analytics</p>
          </div>
        )}

        {/* AI Insights Panel */}
        <InsightsPanel />
      </main>

      <BottomNav />
    </div>
  );
}

// ── Bad Habit Card ─────────────────────────────────────────────────────────────
function BadHabitCard({
  habitName,
  habitIcon,
  dayStats,
  weeklyTrend,
  improvementScore,
}: {
  habitName: string;
  habitIcon: string;
  dayStats: ReturnType<typeof getBadHabitDayStats>;
  weeklyTrend: ReturnType<typeof getBadHabitWeeklyTrend>;
  improvementScore: number;
}) {
  const statusConfig = {
    improving: { color: "text-primary", bg: "bg-primary/10", icon: "trending_down", label: "Improving 👏" },
    same: { color: "text-on-surface-variant", bg: "bg-surface-container-high", icon: "trending_flat", label: "Holding steady" },
    worse: { color: "text-tertiary", bg: "bg-tertiary/10", icon: "trending_up", label: "You can do better 💪" },
  };
  const cfg = statusConfig[dayStats.status];

  return (
    <div className="bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-ambient space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-sm">{habitIcon}</span>
          </div>
          <div>
            <h4 className="font-body font-semibold text-on-surface">{habitName}</h4>
            <span className={`inline-flex items-center gap-1 text-xs font-label font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
              <span className="material-symbols-outlined text-xs">{cfg.icon}</span>
              {cfg.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-headline font-bold text-2xl text-primary">{improvementScore}%</p>
          <p className="font-body text-xs text-on-surface-variant">7-day score</p>
        </div>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container rounded-[1rem] p-3 text-center">
          <p className="font-headline font-bold text-xl text-on-surface">{dayStats.count}</p>
          <p className="font-body text-xs text-on-surface-variant">Today</p>
        </div>
        <div className="bg-surface-container rounded-[1rem] p-3 text-center">
          <p className="font-headline font-bold text-xl text-on-surface">{dayStats.limit}</p>
          <p className="font-body text-xs text-on-surface-variant">Limit</p>
        </div>
        <div className="bg-primary/10 rounded-[1rem] p-3 text-center">
          <p className="font-headline font-bold text-xl text-primary">{dayStats.avoided}</p>
          <p className="font-body text-xs text-primary/70">Avoided ✅</p>
        </div>
      </div>

      {/* Avoidance rate bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-body text-xs text-on-surface-variant">Avoidance rate today</span>
          <span className="font-label font-semibold text-xs text-primary">{dayStats.avoidanceRate}%</span>
        </div>
        <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              dayStats.avoidanceRate >= 70
                ? "bg-primary"
                : dayStats.avoidanceRate >= 40
                ? "bg-amber-400"
                : "bg-tertiary"
            }`}
            style={{ width: `${dayStats.avoidanceRate}%` }}
          />
        </div>
      </div>

      {/* Weekly trend mini chart */}
      <div>
        <p className="font-body text-xs text-on-surface-variant mb-2">This week</p>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTrend} barCategoryGap="15%">
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "#3f4943" }}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-surface-container-lowest rounded-lg px-2 py-1 shadow-ambient text-xs">
                        <p className="text-on-surface-variant">{payload[0].value}% avoided</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="avoidanceRate" radius={[4, 4, 0, 0]}>
                {weeklyTrend.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.avoidanceRate >= 70
                        ? "#005237"
                        : entry.avoidanceRate >= 40
                        ? "#f59e0b"
                        : entry.avoidanceRate > 0
                        ? "#79302d"
                        : "#e0e3df"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Positive reinforcement */}
      <div className="bg-primary/5 rounded-[1rem] p-3">
        <p className="font-body text-xs text-on-surface-variant">
          {improvementScore >= 70
            ? "🌟 Outstanding! You're in great control this week."
            : improvementScore >= 50
            ? "💪 You reduced today. Better than yesterday counts!"
            : improvementScore >= 30
            ? "🌱 Every small step matters. You're building awareness."
            : "💚 Awareness is the first step. You've got this!"}
        </p>
      </div>
    </div>
  );
}
