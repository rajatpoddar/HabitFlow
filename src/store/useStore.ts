import { create } from "zustand";
import type { User, Habit, HabitLog, JournalEntry, Alarm, InsightItem } from "@/types";
import * as authApi from "@/lib/api/auth";
import * as habitsApi from "@/lib/api/habits";
import * as journalApi from "@/lib/api/journal";
import * as alarmsApi from "@/lib/api/alarms";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { format } from "date-fns";

const FREE_HABIT_LIMIT = 5;

interface AppState {
  user: User | null;
  isLoading: boolean;
  habits: Habit[];
  logs: HabitLog[];
  journalEntries: JournalEntry[];
  alarms: Alarm[];
  insights: InsightItem[];
  insightsSummary: string;
  insightsLoading: boolean;
  // Cache timestamps — avoid re-fetching within TTL
  _cache: Record<string, number>;

  // Auth
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;

  // Plan helpers
  canAddHabit: () => boolean;
  isPro: () => boolean;

  // Habits
  fetchHabits: () => Promise<void>;
  createHabit: (data: Omit<Habit, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateHabit: (id: string, data: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  // Logs
  fetchLogs: (startDate?: string, endDate?: string) => Promise<void>;
  toggleHabitLog: (habitId: string, date: Date) => Promise<void>;
  updateBadHabitCount: (habitId: string, date: Date, delta: 1 | -1) => Promise<void>;

  // Journal
  fetchJournalEntries: () => Promise<void>;
  upsertJournalEntry: (
    date: Date,
    data: { good_text: string; bad_text: string; journal_text: string }
  ) => Promise<void>;

  // Alarms
  fetchAlarms: () => Promise<void>;
  upsertAlarm: (
    alarm: Omit<Alarm, "user_id" | "created_at" | "updated_at" | "id"> & { id?: string }
  ) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string, enabled: boolean) => Promise<void>;

  // Insights
  fetchInsights: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  isLoading: true,
  habits: [],
  logs: [],
  journalEntries: [],
  alarms: [],
  insights: [],
  insightsSummary: "",
  insightsLoading: false,
  _cache: {},

  // ─── Plan helpers ──────────────────────────────────────────────────────────

  canAddHabit: () => {
    const { user, habits } = get();
    if (!user) return false;
    if (user.plan === "pro" || user.plan === "admin") return true;
    return habits.length < FREE_HABIT_LIMIT;
  },

  isPro: () => {
    const { user } = get();
    return user?.plan === "pro" || user?.plan === "admin";
  },

  // ─── Auth ─────────────────────────────────────────────────────────────────

  checkAuth: async () => {
    try {
      const user = await authApi.getCurrentUser();
      set({ user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      const user = await authApi.login(email, password);
      set({ user });
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
      throw err;
    }
  },

  signup: async (name, email, password) => {
    try {
      const user = await authApi.signup(name, email, password);
      set({ user });
      toast.success("Account created!");
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
      throw err;
    }
  },

  logout: async () => {
    await authApi.logout();
    set({
      user: null,
      habits: [],
      logs: [],
      journalEntries: [],
      alarms: [],
      insights: [],
      insightsSummary: "",
      _cache: {},
    });
    toast.success("Logged out");
  },

  updateProfile: async (data) => {
    const { user } = get();
    if (!user) return;
    try {
      const updated = await authApi.updateProfile(user.id, data);
      set({ user: updated });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
      throw err;
    }
  },

  changePassword: async (newPassword) => {
    try {
      await authApi.changePassword(newPassword);
      toast.success("Password changed successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
      throw err;
    }
  },

  deleteAccount: async () => {
    const { user } = get();
    if (!user) return;
    try {
      await authApi.deleteAccount(user.id);
      set({
        user: null,
        habits: [],
        logs: [],
        journalEntries: [],
        alarms: [],
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
      throw err;
    }
  },

  // ─── Habits ───────────────────────────────────────────────────────────────

  fetchHabits: async () => {
    const { user, _cache } = get();
    if (!user) return;
    const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
    if (_cache["habits"] && Date.now() - _cache["habits"] < CACHE_TTL) return;
    try {
      const habits = await habitsApi.getHabits(user.id);
      set({ habits, _cache: { ...get()._cache, habits: Date.now() } });
    } catch {
      toast.error("Failed to load habits");
    }
  },

  createHabit: async (data) => {
    const { user, canAddHabit } = get();
    if (!user) return;

    if (!canAddHabit()) {
      toast.error(
        `Free plan is limited to ${FREE_HABIT_LIMIT} habits. Upgrade to Pro for unlimited habits.`,
        { duration: 5000 }
      );
      throw new Error("PLAN_LIMIT_EXCEEDED");
    }

    const tempId = `temp_${Date.now()}`;
    const tempHabit: Habit = {
      ...data,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((s) => ({ habits: [...s.habits, tempHabit] }));
    try {
      const habit = await habitsApi.createHabit({ ...data, user_id: user.id });
      set((s) => ({
        habits: s.habits.map((h) => (h.id === tempId ? habit : h)),
        _cache: { ...s._cache, habits: 0 }, // invalidate
      }));
      toast.success("Habit created! 🌱");
    } catch (err: any) {
      set((s) => ({ habits: s.habits.filter((h) => h.id !== tempId) }));
      if (err.message !== "PLAN_LIMIT_EXCEEDED") {
        toast.error("Failed to create habit");
      }
      throw err;
    }
  },

  updateHabit: async (id, data) => {
    const prev = get().habits.find((h) => h.id === id);
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, ...data } : h)),
    }));
    try {
      const habit = await habitsApi.updateHabit(id, data);
      set((s) => ({
        habits: s.habits.map((h) => (h.id === id ? habit : h)),
      }));
    } catch (err: any) {
      if (prev) set((s) => ({ habits: s.habits.map((h) => (h.id === id ? prev : h)) }));
      toast.error("Failed to update habit");
      throw err;
    }
  },

  deleteHabit: async (id) => {
    const prev = get().habits;
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
    try {
      await habitsApi.deleteHabit(id);
      toast.success("Habit removed");
    } catch {
      set({ habits: prev });
      toast.error("Failed to delete habit");
    }
  },

  // ─── Logs ─────────────────────────────────────────────────────────────────

  fetchLogs: async (startDate, endDate) => {
    const { user, _cache } = get();
    if (!user) return;
    const cacheKey = `logs:${startDate ?? ""}:${endDate ?? ""}`;
    const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
    if (_cache[cacheKey] && Date.now() - _cache[cacheKey] < CACHE_TTL) return;
    try {
      const logs = await habitsApi.getLogsForUser(user.id, startDate, endDate);
      set({ logs, _cache: { ...get()._cache, [cacheKey]: Date.now() } });
    } catch {
      toast.error("Failed to load logs");
    }
  },

  toggleHabitLog: async (habitId, date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const { logs } = get();
    const existing = logs.find(
      (l) => l.habit_id === habitId && l.date === dateStr
    );

    if (existing) {
      if (existing.status === "done") {
        set((s) => ({ logs: s.logs.filter((l) => l.id !== existing.id) }));
      } else {
        set((s) => ({
          logs: s.logs.map((l) =>
            l.id === existing.id ? { ...l, status: "done" } : l
          ),
        }));
      }
    } else {
      const tempLog: HabitLog = {
        id: `temp_${Date.now()}`,
        habit_id: habitId,
        date: dateStr,
        status: "done",
        count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set((s) => ({ logs: [...s.logs, tempLog] }));
    }

    try {
      const result = await habitsApi.toggleHabitLog(
        habitId,
        date,
        existing?.status || null
      );

      if (result) {
        set((s) => {
          const hasTemp = s.logs.some(
            (l) =>
              l.id.startsWith("temp_") &&
              l.habit_id === habitId &&
              l.date === dateStr
          );
          if (hasTemp) {
            return {
              logs: s.logs.map((l) =>
                l.id.startsWith("temp_") &&
                l.habit_id === habitId &&
                l.date === dateStr
                  ? result
                  : l
              ),
            };
          }
          return {
            logs: s.logs.map((l) => (l.id === existing?.id ? result : l)),
          };
        });
      }
    } catch {
      set({ logs });
      toast.error("Failed to update habit");
    }
  },

  updateBadHabitCount: async (habitId, date, delta) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const { logs } = get();
    const existing = logs.find(
      (l) => l.habit_id === habitId && l.date === dateStr
    );

    const newCount = Math.max(0, (existing?.count ?? 0) + delta);
    if (existing) {
      set((s) => ({
        logs: s.logs.map((l) =>
          l.id === existing.id
            ? { ...l, count: newCount, status: "done" }
            : l
        ),
      }));
    } else {
      const tempLog: HabitLog = {
        id: `temp_${Date.now()}`,
        habit_id: habitId,
        date: dateStr,
        status: "done",
        count: newCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set((s) => ({ logs: [...s.logs, tempLog] }));
    }

    try {
      const result = await habitsApi.updateBadHabitCount(habitId, date, delta);
      set((s) => {
        const hasTemp = s.logs.some(
          (l) =>
            l.id.startsWith("temp_") &&
            l.habit_id === habitId &&
            l.date === dateStr
        );
        if (hasTemp) {
          return {
            logs: s.logs.map((l) =>
              l.id.startsWith("temp_") &&
              l.habit_id === habitId &&
              l.date === dateStr
                ? result
                : l
            ),
          };
        }
        return {
          logs: s.logs.map((l) => (l.id === existing?.id ? result : l)),
        };
      });
    } catch {
      set({ logs });
      toast.error("Failed to update count");
    }
  },

  // ─── Journal ──────────────────────────────────────────────────────────────

  fetchJournalEntries: async () => {
    const { user, _cache } = get();
    if (!user) return;
    const CACHE_TTL = 2 * 60 * 1000;
    if (_cache["journal"] && Date.now() - _cache["journal"] < CACHE_TTL) return;
    try {
      const entries = await journalApi.getJournalEntries(user.id);
      set({ journalEntries: entries, _cache: { ...get()._cache, journal: Date.now() } });
    } catch {
      toast.error("Failed to load journal");
    }
  },

  upsertJournalEntry: async (date, data) => {
    const { user } = get();
    if (!user) return;
    try {
      const entry = await journalApi.upsertJournalEntry(user.id, date, data);
      set((s) => {
        const exists = s.journalEntries.find((e) => e.id === entry.id);
        return {
          journalEntries: exists
            ? s.journalEntries.map((e) => (e.id === entry.id ? entry : e))
            : [entry, ...s.journalEntries],
        };
      });
      toast.success("Journal saved ✨");
    } catch (err: any) {
      toast.error("Failed to save journal");
      throw err;
    }
  },

  // ─── Alarms ───────────────────────────────────────────────────────────────

  fetchAlarms: async () => {
    const { user, _cache } = get();
    if (!user) return;
    const CACHE_TTL = 2 * 60 * 1000;
    if (_cache["alarms"] && Date.now() - _cache["alarms"] < CACHE_TTL) return;
    try {
      const alarms = await alarmsApi.getAlarms(user.id);
      set({ alarms, _cache: { ...get()._cache, alarms: Date.now() } });
    } catch {
      toast.error("Failed to load alarms");
    }
  },

  upsertAlarm: async (alarm) => {
    const { user } = get();
    if (!user) return;
    try {
      const saved = await alarmsApi.upsertAlarm(user.id, {
        ...alarm,
        user_id: user.id,
      });
      set((s) => {
        const exists = s.alarms.find((a) => a.id === saved.id);
        return {
          alarms: exists
            ? s.alarms.map((a) => (a.id === saved.id ? saved : a))
            : [...s.alarms, saved],
        };
      });
      toast.success("Alarm saved ⏰");
    } catch {
      toast.error("Failed to save alarm");
    }
  },

  deleteAlarm: async (id) => {
    const prev = get().alarms;
    set((s) => ({ alarms: s.alarms.filter((a) => a.id !== id) }));
    try {
      await alarmsApi.deleteAlarm(id);
    } catch {
      set({ alarms: prev });
      toast.error("Failed to delete alarm");
    }
  },

  toggleAlarm: async (id, enabled) => {
    set((s) => ({
      alarms: s.alarms.map((a) => (a.id === id ? { ...a, enabled } : a)),
    }));
    try {
      await alarmsApi.toggleAlarm(id, enabled);
    } catch {
      set((s) => ({
        alarms: s.alarms.map((a) =>
          a.id === id ? { ...a, enabled: !enabled } : a
        ),
      }));
      toast.error("Failed to update alarm");
    }
  },

  // ─── Insights ─────────────────────────────────────────────────────────────

  fetchInsights: async () => {
    const { user } = get();
    if (!user) return;
    set({ insightsLoading: true });
    try {
      const res = await fetch("/api/insights");
      if (!res.ok) throw new Error("Failed to fetch insights");
      const data = await res.json();
      set({
        insights: data.insights ?? [],
        insightsSummary: data.summary ?? "",
        insightsLoading: false,
      });
    } catch {
      set({ insightsLoading: false });
    }
  },
}));
