// Mock Supabase before any imports that use it
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}));

import { getDailyStats, getOverallStreak, getGoodVsBadStats } from "@/lib/api/analytics";
import { calculateStreak } from "@/lib/api/habits";
import type { Habit, HabitLog } from "@/types";

const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: "h1",
  user_id: "u1",
  name: "Test Habit",
  type: "good",
  category: "Health",
  icon: "check",
  color: "#005237",
  frequency: "daily",
  target_per_day: 1,
  is_active: true,
  reminder_enabled: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const makeLog = (overrides: Partial<HabitLog> = {}): HabitLog => ({
  id: "l1",
  habit_id: "h1",
  date: "2024-01-15",
  status: "done",
  count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe("getDailyStats", () => {
  it("returns 0% when no habits", () => {
    const stats = getDailyStats([], [], new Date("2024-01-15"));
    expect(stats.percentage).toBe(0);
    expect(stats.total).toBe(0);
  });

  it("calculates correct completion percentage", () => {
    const habits = [makeHabit({ id: "h1" }), makeHabit({ id: "h2" })];
    const logs = [makeLog({ habit_id: "h1", date: "2024-01-15", status: "done" })];
    const stats = getDailyStats(habits, logs, new Date("2024-01-15"));
    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.percentage).toBe(50);
  });

  it("returns 100% when all habits done", () => {
    const habits = [makeHabit({ id: "h1" })];
    const logs = [makeLog({ habit_id: "h1", date: "2024-01-15", status: "done" })];
    const stats = getDailyStats(habits, logs, new Date("2024-01-15"));
    expect(stats.percentage).toBe(100);
  });
});

describe("calculateStreak", () => {
  it("returns 0 for empty logs", () => {
    const { current, longest } = calculateStreak([]);
    expect(current).toBe(0);
    expect(longest).toBe(0);
  });

  it("calculates consecutive streak correctly", () => {
    const today = new Date();
    const logs: HabitLog[] = [0, 1, 2].map((daysAgo) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return makeLog({
        id: `l${daysAgo}`,
        date: d.toISOString().split("T")[0],
        status: "done",
      });
    });
    const { current, longest } = calculateStreak(logs);
    expect(current).toBeGreaterThanOrEqual(1);
    expect(longest).toBeGreaterThanOrEqual(current);
  });
});

describe("getGoodVsBadStats", () => {
  it("separates good and bad habits correctly", () => {
    const habits = [
      makeHabit({ id: "h1", type: "good" }),
      makeHabit({ id: "h2", type: "bad" }),
    ];
    const logs = [
      makeLog({ id: "l1", habit_id: "h1", status: "done" }),
      makeLog({ id: "l2", habit_id: "h2", status: "done" }),
    ];
    const stats = getGoodVsBadStats(habits, logs);
    expect(stats.goodHabits).toBe(1);
    expect(stats.badHabits).toBe(1);
    expect(stats.goodCompletionRate).toBe(100);
  });

  it("handles no habits gracefully", () => {
    const stats = getGoodVsBadStats([], []);
    expect(stats.goodCompletionRate).toBe(0);
    expect(stats.badControlRate).toBe(0);
  });
});
