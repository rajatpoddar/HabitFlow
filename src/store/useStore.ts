import { create } from "zustand";
import type { User, Habit, HabitLog, JournalEntry, Alarm, InsightItem } from "@/types";
import * as authApi from "@/lib/api/auth";
import * as habitsApi from "@/lib/api/habits";
import * as journalApi from "@/lib/api/journal";
import * as alarmsApi from "@/lib/api/alarms";
import toast from "react-hot-toast";
import { getSession } from "next-auth/react";

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
        const user = await authApi.getCurrentUser();
        set({ user, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
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

  fetchHabits: async () => {
    const { user, _cache } = get();
    if (!user) return;
    const CACHE_TTL = 2 * 60 * 1000;
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
      toast.error(`Free plan limit reached.`);
      throw new Error("PLAN_LIMIT_EXCEEDED");
    }

    try {
      const habit = await habitsApi.createHabit({ ...data, user_id: user.id });
      set((s) => ({
        habits: [...s.habits, habit],
        _cache: { ...s._cache, habits: 0 },
      }));
      toast.success("Habit created! 🌱");
    } catch (err: any) {
      toast.error("Failed to create habit");
      throw err;
    }
  },

  updateHabit: async (id, data) => {
    try {
      const habit = await habitsApi.updateHabit(id, data);
      set((s) => ({
        habits: s.habits.map((h) => (h.id === id ? habit : h)),
      }));
    } catch (err: any) {
      toast.error("Failed to update habit");
      throw err;
    }
  },

  deleteHabit: async (id) => {
    try {
      await habitsApi.deleteHabit(id);
      set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
      toast.success("Habit removed");
    } catch {
      toast.error("Failed to delete habit");
    }
  },

  fetchLogs: async (startDate, endDate) => {
    const { user, _cache } = get();
    if (!user) return;
    const cacheKey = `logs:${startDate ?? ""}:${endDate ?? ""}`;
    const CACHE_TTL = 2 * 60 * 1000;
    if (_cache[cacheKey] && Date.now() - _cache[cacheKey] < CACHE_TTL) return;
    try {
      const logs = await habitsApi.getLogsForUser(user.id, startDate, endDate);
      set({ logs, _cache: { ...get()._cache, [cacheKey]: Date.now() } });
    } catch {
      toast.error("Failed to load logs");
    }
  },

  toggleHabitLog: async (habitId, date) => {
    try {
      const result = await habitsApi.toggleHabitLog(habitId, date, null);
      set((s) => {
        if (result) {
          const exists = s.logs.find(l => l.id === result.id);
          return {
            logs: exists ? s.logs.map(l => l.id === result.id ? result : l) : [...s.logs, result]
          };
        } else {
          // It was a delete
          return {
            logs: s.logs.filter(l => !(l.habit_id === habitId && l.date === habitsApi.format(date, "yyyy-MM-dd")))
          };
        }
      });
    } catch {
      toast.error("Failed to update habit");
    }
  },

  updateBadHabitCount: async (habitId, date, delta) => {
    try {
      const result = await habitsApi.updateBadHabitCount(habitId, date, delta);
      set((s) => {
        const exists = s.logs.find(l => l.id === result.id);
        return {
          logs: exists ? s.logs.map(l => l.id === result.id ? result : l) : [...s.logs, result]
        };
      });
    } catch {
      toast.error("Failed to update count");
    }
  },

  fetchJournalEntries: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const entries = await journalApi.getJournalEntries(user.id);
      set({ journalEntries: entries });
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

  fetchAlarms: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const alarms = await alarmsApi.getAlarms(user.id);
      set({ alarms });
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
    try {
      await alarmsApi.deleteAlarm(id);
      set((s) => ({ alarms: s.alarms.filter((a) => a.id !== id) }));
    } catch {
      toast.error("Failed to delete alarm");
    }
  },

  toggleAlarm: async (id, enabled) => {
    try {
      const updated = await alarmsApi.toggleAlarm(id, enabled);
      set((s) => ({
        alarms: s.alarms.map((a) => (a.id === id ? updated : a)),
      }));
    } catch {
      toast.error("Failed to update alarm");
    }
  },

  fetchInsights: async () => {
    const { user } = get();
    if (!user) return;
    set({ insightsLoading: true });
    try {
      const res = await fetch("/api/insights");
      if (!res.ok) throw new Error("Failed");
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
