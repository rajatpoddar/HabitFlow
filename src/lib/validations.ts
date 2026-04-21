import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(254, "Email too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password too long"),
});

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name too long")
      .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address")
      .max(254, "Email too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password too long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters")
    .optional(),
  email: z.string().email("Invalid email address").max(254).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number"
      ),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

// ── Habits ────────────────────────────────────────────────────────────────────

export const createHabitSchema = z.object({
  name: z
    .string()
    .min(1, "Habit name is required")
    .max(100, "Name too long")
    .trim(),
  type: z.enum(["good", "bad"]),
  category: z.string().min(1).max(50),
  icon: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  frequency: z.enum(["daily", "weekly"]),
  target_per_day: z.number().int().min(1).max(100),
  reminder_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format")
    .nullable()
    .optional(),
  reminder_enabled: z.boolean().default(false),
  daily_limit: z.number().int().min(1).max(1000).nullable().optional(),
});

export const updateHabitSchema = createHabitSchema.partial();

// ── Journal ───────────────────────────────────────────────────────────────────

export const journalEntrySchema = z.object({
  good_text: z.string().max(5000, "Too long").default(""),
  bad_text: z.string().max(5000, "Too long").default(""),
  journal_text: z.string().max(10000, "Too long").default(""),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

// ── Alarms ────────────────────────────────────────────────────────────────────

export const alarmSchema = z.object({
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format"),
  label: z.string().min(1).max(100).default("Wake up"),
  enabled: z.boolean().default(true),
});

// ── Admin ─────────────────────────────────────────────────────────────────────

export const banUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  reason: z.string().min(1, "Reason is required").max(500),
});

export const updateUserPlanSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  plan: z.enum(["free", "pro", "admin"]),
});

// ── Types inferred from schemas ───────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
export type AlarmInput = z.infer<typeof alarmSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type UpdateUserPlanInput = z.infer<typeof updateUserPlanSchema>;
