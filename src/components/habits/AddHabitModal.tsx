"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import type { HabitType, HabitFrequency } from "@/types";
import IconPicker from "./IconPicker";

interface AddHabitModalProps {
  onClose: () => void;
}

const CATEGORIES = [
  "Health",
  "Fitness",
  "Mental Health",
  "Learning",
  "Productivity",
  "Nutrition",
  "Sleep",
  "Social",
  "Finance",
  "Addiction",
  "Other",
];

const COLORS = [
  "#005237",
  "#006d4a",
  "#79302d",
  "#2d676d",
  "#4e6457",
  "#006c49",
];

export default function AddHabitModal({ onClose }: AddHabitModalProps) {
  const createHabit = useStore((s) => s.createHabit);
  const user = useStore((s) => s.user);

  const [name, setName] = useState("");
  const [type, setType] = useState<HabitType>("good");
  const [category, setCategory] = useState("Health");
  const [icon, setIcon] = useState("self_improvement");
  const [color, setColor] = useState("#005237");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [targetPerDay, setTargetPerDay] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Reminder fields
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");

  // Bad habit fields
  const [dailyLimit, setDailyLimit] = useState(5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setIsLoading(true);
    try {
      await createHabit({
        user_id: user.id,
        name: name.trim(),
        type,
        category,
        icon,
        color,
        frequency,
        target_per_day: targetPerDay,
        is_active: true,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderEnabled ? reminderTime : null,
        daily_limit: type === "bad" ? dailyLimit : null,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface rounded-[2rem] shadow-ambient-lg overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <h2 className="font-headline text-lg font-bold text-on-surface">
            New Seed
          </h2>
          <div className="w-10" />
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[80vh]">
          <div className="px-6 py-6 space-y-8">
            {/* Habit Name */}
            <div className="bg-surface-container-highest rounded-DEFAULT p-5 relative">
              <label className="font-label text-sm font-medium text-on-surface-variant mb-2 block">
                What do you want to grow?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Drink Water, Read 20 mins"
                required
                autoFocus
                className="w-full bg-transparent border-none p-0 text-2xl font-headline font-bold text-on-surface placeholder:text-outline-variant focus:ring-0 outline-none"
              />
              <div className="absolute bottom-0 left-5 right-5 h-0.5 bg-primary/20 rounded-t-full" />
            </div>

            {/* Habit Type */}
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface mb-4">
                Habit Type
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("good")}
                  className={`p-4 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all ${
                    type === "good"
                      ? "bg-primary text-on-primary shadow-primary-glow"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">trending_up</span>
                  <span className="font-label font-semibold text-sm">Good Habit</span>
                  <span className="font-body text-xs opacity-70 text-center">Build & maintain</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType("bad")}
                  className={`p-4 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all ${
                    type === "bad"
                      ? "bg-tertiary text-on-tertiary shadow-md"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">trending_down</span>
                  <span className="font-label font-semibold text-sm">Bad Habit</span>
                  <span className="font-body text-xs opacity-70 text-center">Reduce & avoid</span>
                </button>
              </div>
              {type === "bad" && (
                <p className="mt-3 text-xs font-body text-on-surface-variant bg-surface-container-low rounded-xl p-3">
                  💚 Track how many times you do this habit each day. Set a daily limit to measure your progress.
                </p>
              )}
            </div>

            {/* Bad Habit: Daily Limit */}
            {type === "bad" && (
              <div className="bg-surface-container-low rounded-[1.5rem] p-5">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-headline font-bold text-on-surface">Daily Limit</div>
                    <div className="font-body text-on-surface-variant text-sm mt-0.5">
                      Max times allowed per day
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-surface-container-highest rounded-full p-1">
                    <button
                      type="button"
                      onClick={() => setDailyLimit(Math.max(1, dailyLimit - 1))}
                      className="w-10 h-10 rounded-full bg-surface text-on-surface flex items-center justify-center shadow-sm hover:bg-surface-bright transition-colors"
                    >
                      <span className="material-symbols-outlined">remove</span>
                    </button>
                    <span className="font-headline font-bold text-on-surface w-8 text-center">
                      {dailyLimit}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDailyLimit(dailyLimit + 1)}
                      className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </div>
                <p className="font-body text-xs text-on-surface-variant mt-2">
                  Example: Limit = {dailyLimit} → if you do it {Math.max(1, dailyLimit - 2)} times, you avoided {Math.min(2, dailyLimit - 1)} ✅
                </p>
              </div>
            )}

            {/* Frequency */}
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface mb-4">
                Frequency
              </h3>
              <div className="flex gap-3">
                {(["daily", "weekly"] as HabitFrequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`px-6 py-3 rounded-full font-label font-medium capitalize transition-all ${
                      frequency === f
                        ? "bg-primary text-on-primary shadow-primary-glow"
                        : "bg-surface-variant/40 text-on-surface-variant border border-outline-variant/15 hover:bg-surface-variant/60"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface mb-4">
                Icon
              </h3>
              <IconPicker selected={icon} onSelect={setIcon} />
            </div>

            {/* Category */}
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface mb-4">
                Category
              </h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-4 py-2 rounded-full font-label text-sm font-medium transition-all ${
                      category === c
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Target — only for good habits */}
            {type === "good" && (
              <div className="bg-surface-container-low rounded-[1.5rem] p-5 flex justify-between items-center">
                <div>
                  <div className="font-headline font-bold text-on-surface">Daily Target</div>
                  <div className="font-body text-on-surface-variant text-sm mt-1">Times per day</div>
                </div>
                <div className="flex items-center gap-3 bg-surface-container-highest rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setTargetPerDay(Math.max(1, targetPerDay - 1))}
                    className="w-10 h-10 rounded-full bg-surface text-on-surface flex items-center justify-center shadow-sm hover:bg-surface-bright transition-colors"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                  <span className="font-headline font-bold text-on-surface w-8 text-center">
                    {targetPerDay}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTargetPerDay(targetPerDay + 1)}
                    className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            )}

            {/* Reminder */}
            <div className="bg-surface-container-low rounded-[1.5rem] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">notifications</span>
                  </div>
                  <div>
                    <div className="font-headline font-bold text-on-surface">Reminder</div>
                    <div className="font-body text-on-surface-variant text-sm">
                      Get notified at a set time
                    </div>
                  </div>
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    reminderEnabled ? "bg-primary" : "bg-surface-container-highest"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      reminderEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {reminderEnabled && (
                <div className="flex items-center gap-3 bg-surface-container-highest rounded-[1.25rem] p-4">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  <div className="flex-1">
                    <label className="font-label text-xs text-on-surface-variant block mb-1">
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="bg-transparent border-none font-headline font-bold text-on-surface text-lg focus:ring-0 outline-none w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 pb-6">
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full py-5 font-headline font-bold text-lg shadow-primary-glow hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">eco</span>
                  Plant Seed
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
