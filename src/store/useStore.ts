import { create } from "zustand";
import type { User, Habit, HabitLog, JournalEntry, Alarm, InsightItem } from "@/types";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { getSession, signOut } from "next-auth/react";

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
  _cache: Record<string, number>;

  // Auth
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  deleteAccount: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;

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

  // Utils
  resetCache: () => void;
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

  checkAuth: async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        set({ user: data.user, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  logout: async () => {
    await signOut({ redirect: false });
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
    window.location.href = "/login";
  },

  updateProfile: async (data) => {
    const { user } = get();
    if (!user) return;
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      set({ user: result.user });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
      throw err;
    }
  },

  deleteAccount: async () => {
    const { user } = get();
    if (!user) return;
    try {
      await fetch("/api/auth/profile", { method: "DELETE" });
      await signOut({ redirect: false });
      set({ user: null, habits: [], logs: [], journalEntries: [], alarms: [] });
      window.location.href = "/login";
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
      throw err;
    }
  },

  changePassword: async (newPassword: string) => {
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ newPassword }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      toast.success("Password updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
      throw err;
    }
  },

  fetchHabits: async (force = false) => {
    const { user, _cache } = get();
    if (!user) return;
    const CACHE_TTL = 2 * 60 * 1000;
    if (!force && _cache["habits"] && Date.now() - _cache["habits"] < CACHE_TTL) return;
    try {
      const res = await fetch("/api/habits");
      const data = await res.json();
      set({ habits: data.habits || [], _cache: { ...get()._cache, habits: Date.now() } });
    } catch {
      toast.error("Failed to load habits");
    }
  },

  createHabit: async (data) => {
    const { canAddHabit } = get();
    if (!canAddHabit()) {
      toast.error(`Free plan limit reached.`);
      throw new Error("PLAN_LIMIT_EXCEEDED");
    }

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      set((s) => ({
        habits: [...s.habits, result.habit],
        _cache: { ...s._cache, habits: 0 },
      }));
      toast.success("Habit created! 🌱");
    } catch (err: any) {
      toast.error(err.message || "Failed to create habit");
      throw err;
    }
  },

  updateHabit: async (id, data) => {
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      set((s) => ({
        habits: s.habits.map((h) => (h.id === id ? result.habit : h)),
      }));
    } catch (err: any) {
      toast.error("Failed to update habit");
      throw err;
    }
  },

  deleteHabit: async (id) => {
    try {
      await fetch(`/api/habits/${id}`, { method: "DELETE" });
      set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
      toast.success("Habit removed");
    } catch {
      toast.error("Failed to delete habit");
    }
  },

  fetchLogs: async (startDate, endDate, force = false) => {
    const { user, _cache } = get();
    if (!user) return;
    const cacheKey = `logs:${startDate ?? ""}:${endDate ?? ""}`;
    const CACHE_TTL = 2 * 60 * 1000;
    if (!force && _cache[cacheKey] && Date.now() - _cache[cacheKey] < CACHE_TTL) return;
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await fetch(`/api/logs?${params.toString()}`);
      const data = await res.json();
      set({ logs: data.logs || [], _cache: { ...get()._cache, [cacheKey]: Date.now() } });
    } catch {
      toast.error("Failed to load logs");
    }
  },

  toggleHabitLog: async (habitId, date) => {
    try {
      const res = await fetch("/api/logs/toggle", {
        method: "POST",
        body: JSON.stringify({ habitId, date: date.toISOString() }),
      });
      const result = await res.json();
      set((s) => {
        if (result.log) {
          const exists = s.logs.find(l => l.id === result.log.id);
          return {
            logs: exists ? s.logs.map(l => l.id === result.log.id ? result.log : l) : [...s.logs, result.log]
          };
        } else {
          const dateStr = format(date, "yyyy-MM-dd");
          return { logs: s.logs.filter(l => !(l.habit_id === habitId && l.date === dateStr)) };
        }
      });
    } catch {
      toast.error("Failed to update habit");
    }
  },

  updateBadHabitCount: async (habitId, date, delta) => {
    try {
      const res = await fetch("/api/logs/count", {
        method: "POST",
        body: JSON.stringify({ habitId, date: date.toISOString(), delta }),
      });
      const result = await res.json();
      set((s) => {
        const exists = s.logs.find(l => l.id === result.log.id);
        return {
          logs: exists ? s.logs.map(l => l.id === result.log.id ? result.log : l) : [...s.logs, result.log]
        };
      });
    } catch {
      toast.error("Failed to update count");
    }
  },

  fetchJournalEntries: async () => {
    try {
      const res = await fetch("/api/journal");
      const data = await res.json();
      set({ journalEntries: data.entries || [] });
    } catch {
      toast.error("Failed to load journal");
    }
  },

  upsertJournalEntry: async (date, data) => {
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        body: JSON.stringify({ date: date.toISOString(), ...data }),
      });
      const result = await res.json();
      set((s) => {
        const exists = s.journalEntries.find((e) => e.id === result.entry.id);
        return {
          journalEntries: exists
            ? s.journalEntries.map((e) => (e.id === result.entry.id ? result.entry : e))
            : [result.entry, ...s.journalEntries],
        };
      });
      toast.success("Journal saved ✨");
    } catch (err: any) {
      toast.error("Failed to save journal");
      throw err;
    }
  },

  fetchAlarms: async () => {
    try {
      const res = await fetch("/api/alarms");
      const data = await res.json();
      set({ alarms: data.alarms || [] });
    } catch {
      toast.error("Failed to load alarms");
    }
  },

  upsertAlarm: async (alarm) => {
    try {
      const res = await fetch("/api/alarms", {
        method: "POST",
        body: JSON.stringify(alarm),
      });
      const result = await res.json();
      set((s) => {
        const exists = s.alarms.find((a) => a.id === result.alarm.id);
        return {
          alarms: exists
            ? s.alarms.map((a) => (a.id === result.alarm.id ? result.alarm : a))
            : [...s.alarms, result.alarm],
        };
      });
      toast.success("Alarm saved ⏰");
    } catch {
      toast.error("Failed to save alarm");
    }
  },

  deleteAlarm: async (id) => {
    try {
      await fetch(`/api/alarms/${id}`, { method: "DELETE" });
      set((s) => ({ alarms: s.alarms.filter((a) => a.id !== id) }));
    } catch {
      toast.error("Failed to delete alarm");
    }
  },

  toggleAlarm: async (id, enabled) => {
    try {
      const res = await fetch(`/api/alarms/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
      const result = await res.json();
      set((s) => ({
        alarms: s.alarms.map((a) => (a.id === id ? result.alarm : a)),
      }));
    } catch {
      toast.error("Failed to update alarm");
    }
  },

  fetchInsights: async () => {
    set({ insightsLoading: true });
    try {
      const res = await fetch("/api/insights");
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
  resetCache: () => {
    set({ _cache: {} });
  },
}));
