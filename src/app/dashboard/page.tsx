"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useStore } from "@/store/useStore";
import BottomNav from "@/components/ui/BottomNav";
import TopBar from "@/components/ui/TopBar";
import HabitItem from "@/components/habits/HabitItem";
import AddHabitModal from "@/components/habits/AddHabitModal";
import EditHabitModal from "@/components/habits/EditHabitModal";
import ProgressRing from "@/components/ui/ProgressRing";
import PlanBanner from "@/components/ui/PlanBanner";
import NotificationPermissionBanner from "@/components/notifications/NotificationPermissionBanner";
import PWAInstallBanner from "@/components/pwa/PWAInstallBanner";
import type { Habit } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, habits, logs, isLoading, checkAuth, fetchHabits, fetchLogs } =
    useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  useEffect(() => {
    checkAuth().then(() => {
      const { user } = useStore.getState();
      if (!user) { router.push("/login"); return; }
      // Parallel fetch — no waterfall
      Promise.all([fetchHabits(), fetchLogs()]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayLogs = useMemo(
    () => logs.filter((l) => l.date === todayStr),
    [logs, todayStr]
  );

  const completedCount = useMemo(
    () => todayLogs.filter((l) => l.status === "done").length,
    [todayLogs]
  );

  const completionPct = useMemo(
    () =>
      habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0,
    [completedCount, habits.length]
  );

  const currentStreak = useMemo(() => {
    if (logs.length === 0) return 0;
    let streak = 0;
    const checkDate = new Date(today);
    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const dayLogs = logs.filter(
        (l) => l.date === dateStr && l.status === "done"
      );
      if (dayLogs.length === 0 && streak === 0) {
        // Check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        const yestStr = format(checkDate, "yyyy-MM-dd");
        const yestLogs = logs.filter(
          (l) => l.date === yestStr && l.status === "done"
        );
        if (yestLogs.length === 0) break;
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dayLogs.length > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [logs, today]);

  const goodHabits = useMemo(() => habits.filter((h) => h.type === "good"), [habits]);
  const badHabits = useMemo(() => habits.filter((h) => h.type === "bad"), [habits]);

  const getLogForHabit = useCallback(
    (habitId: string) => todayLogs.find((l) => l.habit_id === habitId),
    [todayLogs]
  );

  const remainingCount = habits.length - completedCount;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="font-body text-on-surface-variant">
            Loading your forest...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-28">
      <TopBar />

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-8">
        {/* Greeting */}
        <div>
          <p className="font-body text-on-surface-variant text-sm">
            {format(today, "EEEE, MMMM d")}
          </p>
          <h2 className="font-headline text-2xl font-bold text-on-surface mt-1">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 17
              ? "afternoon"
              : "evening"}
            , {user?.name?.split(" ")[0] || "there"} 👋
          </h2>
        </div>

        {habits.length === 0 ? (
          /* Empty State */          <section className="relative bg-surface-container-low rounded-[2rem] overflow-hidden p-8 flex flex-col items-center text-center">
            <div className="relative z-10 max-w-sm mx-auto flex flex-col items-center">
              <div className="w-24 h-24 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined icon-fill text-primary text-5xl">
                  forest
                </span>
              </div>
              <h2 className="font-headline text-2xl font-extrabold text-on-surface mb-3">
                Start your forest.
                <br />
                Plant your first habit seed.
              </h2>
              <p className="font-body text-on-surface-variant mb-8">
                Your digital conservatory is waiting to grow. Begin tracking
                your daily routines.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-primary text-on-primary rounded-full px-8 py-4 font-label font-bold text-lg flex items-center gap-3 hover:scale-105 hover:bg-secondary-container hover:text-on-secondary-container transition-all shadow-primary-glow group"
              >
                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">
                  add_circle
                </span>
                Plant a Seed
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Plan Banner */}
            <PlanBanner />

            {/* PWA Install Banner */}
            <PWAInstallBanner />

            {/* Notification Permission Banner */}
            <NotificationPermissionBanner />

            {/* Hero Bento */}
            <section className="grid grid-cols-3 gap-4">
              {/* Progress Card */}
              <div className="col-span-2 bg-surface-container-low rounded-[1.5rem] p-6 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-headline text-lg font-bold text-primary">
                    Today&apos;s Progress
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant mt-1">
                    {completionPct >= 80
                      ? "You're crushing it! 🔥"
                      : completionPct >= 50
                      ? "Keep the momentum going!"
                      : "Every step counts 🌱"}
                  </p>
                </div>
                <div className="mt-6 flex items-end justify-between relative z-10">
                  <div>
                    <span className="font-headline text-5xl font-extrabold text-primary tracking-tighter">
                      {completionPct}%
                    </span>
                    <span className="font-body text-xs text-on-surface-variant ml-2 uppercase tracking-widest font-medium">
                      Done
                    </span>
                  </div>
                  {remainingCount > 0 && (
                    <div className="bg-surface-container text-on-surface-variant px-3 py-1.5 rounded-xl text-xs font-semibold">
                      {remainingCount} left
                    </div>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-2 bg-surface-container rounded-full overflow-hidden relative z-10">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <div className="absolute right-0 bottom-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-primary-container/20 rounded-tl-full -mr-8 -mb-8 pointer-events-none" />
              </div>

              {/* Streak Card */}
              <div className="bg-gradient-to-br from-primary to-primary-container rounded-[1.5rem] p-5 text-on-primary flex flex-col items-center justify-center text-center shadow-primary-glow">
                <span
                  className="material-symbols-outlined text-4xl mb-2"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
                <span className="font-headline text-4xl font-extrabold tracking-tighter">
                  {currentStreak}
                </span>
                <span className="font-body text-xs uppercase tracking-widest opacity-90 mt-1">
                  Day Streak
                </span>
              </div>
            </section>

            {/* Good Habits */}
            {goodHabits.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">
                      trending_up
                    </span>
                    Good Habits
                  </h3>
                  <span className="font-body text-sm text-on-surface-variant">
                    {goodHabits.filter((h) => getLogForHabit(h.id)?.status === "done").length}/{goodHabits.length} done
                  </span>
                </div>
                <div className="space-y-3">
                  {goodHabits.map((habit) => (
                    <HabitItem
                      key={habit.id}
                      habit={habit}
                      log={getLogForHabit(habit.id)}
                      date={today}
                      onEdit={setEditingHabit}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Bad Habits */}
            {badHabits.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-xl">
                      trending_down
                    </span>
                    Breaking Bad Habits
                  </h3>
                  <span className="font-body text-sm text-on-surface-variant">
                    {badHabits.filter((h) => getLogForHabit(h.id)?.status === "done").length}/{badHabits.length} avoided
                  </span>
                </div>
                <div className="bg-tertiary/5 rounded-[1.5rem] p-4 mb-3">
                  <p className="font-body text-xs text-on-surface-variant">
                    ✅ Mark as done = you successfully avoided this today. You&apos;re doing great!
                  </p>
                </div>
                <div className="space-y-3">
                  {badHabits.map((habit) => (
                    <HabitItem
                      key={habit.id}
                      habit={habit}
                      log={getLogForHabit(habit.id)}
                      date={today}
                      onEdit={setEditingHabit}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Motivational message */}
            {completionPct === 100 && (
              <div className="bg-secondary-container rounded-[1.5rem] p-6 text-center">
                <span className="text-3xl">🎉</span>
                <h3 className="font-headline font-bold text-on-secondary-container text-lg mt-2">
                  Perfect Day!
                </h3>
                <p className="font-body text-on-secondary-container/80 text-sm mt-1">
                  You completed all your habits today. You&apos;re improving every day!
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-primary to-primary-container text-on-primary flex items-center justify-center shadow-primary-glow hover:scale-105 transition-transform z-40"
        aria-label="Add new habit"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      <BottomNav />

      {showAddModal && (
        <AddHabitModal onClose={() => setShowAddModal(false)} />
      )}

      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
        />
      )}
    </div>
  );
}
