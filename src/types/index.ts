export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan?: "free" | "pro" | "admin";
  created_at: string;
  updated_at: string;
}

export type HabitType = "good" | "bad";
export type HabitFrequency = "daily" | "weekdays" | "weekends" | "custom_days" | "times_per_week";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  type: HabitType;
  category: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  target_per_day: number;
  is_active: boolean;
  reminder_time?: string | null;
  reminder_enabled: boolean;
  daily_limit?: number | null;
  custom_days?: number[] | null;
  times_per_week?: number | null;
  created_at: string;
  updated_at: string;
}

export type LogStatus = "done" | "missed";

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  status: LogStatus;
  count: number;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  good_text: string;
  bad_text: string;
  journal_text: string;
  created_at: string;
  updated_at: string;
}

export interface Alarm {
  id: string;
  user_id?: string;
  time: string;
  label: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  plan: "free" | "pro" | "admin";
  is_banned: boolean;
  ban_reason: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  created_at: string;
  updated_at: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface DailyStats {
  date: string;
  total: number;
  completed: number;
  percentage: number;
}

export interface HabitStats {
  habit: Habit;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
}

export interface WeeklyData {
  day: string;
  completed: number;
  total: number;
  percentage: number;
}

export interface HeatmapCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface BadHabitDayStats {
  habitId: string;
  date: string;
  count: number;
  limit: number;
  avoided: number;
  avoidanceRate: number;
  status: "improving" | "same" | "worse";
}

export interface BadHabitWeeklyTrend {
  day: string;
  count: number;
  limit: number;
  avoidanceRate: number;
}

// ── AI Insights ───────────────────────────────────────────────────────────────

export interface InsightItem {
  type: "positive" | "warning" | "info" | "achievement";
  icon: string;
  title: string;
  description: string;
  metric?: string;
}

export interface AiInsights {
  id: string;
  user_id: string;
  week_start: string;
  insights: InsightItem[];
  summary: string;
  generated_at: string;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  name: string | null;
  plan: "free" | "pro" | "admin";
  is_banned: boolean;
  ban_reason: string | null;
  avatar_url: string | null;
  habit_count: number;
  logs_last_7_days: number;
}

export interface AdminStats {
  totalUsers: number;
  proUsers: number;
  bannedUsers: number;
  activeWeekly: number;
  activeDaily: number;
  totalHabits: number;
  logsThisWeek: number;
  topCategories: { name: string; count: number }[];
  completionTrend: { date: string; completions: number }[];
}

// ── Monetization ──────────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  free: { habits: 5, analytics: false, aiInsights: false },
  pro: { habits: Infinity, analytics: true, aiInsights: true },
  admin: { habits: Infinity, analytics: true, aiInsights: true },
} as const;
