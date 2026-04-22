"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import type { Habit, HabitFrequency } from "@/types";
import IconPicker from "./IconPicker";

interface EditHabitModalProps {
  habit: Habit;
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

export default function EditHabitModal({ habit, onClose }: EditHabitModalProps) {
  const updateHabit = useStore((s) => s.updateHabit);
  const deleteHabit = useStore((s) => s.deleteHabit);

  const [name, setName] = useState(habit.name);
  const [category, setCategory] = useState(habit.category);
  const [icon, setIcon] = useState(habit.icon);
  const [frequency, setFrequency] = useState<HabitFrequency>(habit.frequency);
  const [targetPerDay, setTargetPerDay] = useState(habit.target_per_day);
  const [dailyLimit, setDailyLimit] = useState(habit.daily_limit ?? 5);
  const [reminderEnabled, setReminderEnabled] = useState(habit.reminder_enabled ?? false);
  // Supabase returns TIME as HH:MM:SS — trim to HH:MM for <input type="time">
  const [reminderTime, setReminderTime] = useState(
    (habit.reminder_time ?? "09:00").slice(0, 5)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "icon">("edit");

  const isBad = habit.type === "bad";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await updateHabit(habit.id, {
        name: name.trim(),
        category,
        icon,
        frequency,
        target_per_day: targetPerDay,
        daily_limit: isBad ? dailyLimit : null,
        reminder_enabled: reminderEnabled,
        // Supabase TIME columns store HH:MM:SS — append seconds so the cron query matches
        reminder_time: reminderEnabled ? `${reminderTime}:00` : null,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteHabit(habit.id);
      onClose();
    } finally {
      setIsDeleting(false);
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
          <h2 className="font-headline text-lg font-bold text-on-surface">Edit Habit</h2>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-error-container hover:bg-error/20 transition-colors text-on-error-container"
            aria-label="Delete habit"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {(["edit", "icon"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full font-label font-semibold text-sm capitalize transition-all ${
                activeTab === tab
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {tab === "edit" ? "Details" : "Icon"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="overflow-y-auto max-h-[75vh]">
          <div className="px-6 py-5 space-y-6">

            {activeTab === "edit" ? (
              <>
                {/* Habit Name */}
                <div className="bg-surface-container-highest rounded-DEFAULT p-5 relative">
                  <label className="font-label text-sm font-medium text-on-surface-variant mb-2 block">
                    Habit name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-transparent border-none p-0 text-2xl font-headline font-bold text-on-surface placeholder:text-outline-variant focus:ring-0 outline-none"
                  />
                  <div className="absolute bottom-0 left-5 right-5 h-0.5 bg-primary/20 rounded-t-full" />
                </div>

                {/* Type badge (read-only) */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-xs font-semibold ${
                      isBad
                        ? "bg-tertiary/10 text-tertiary"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isBad ? "trending_down" : "trending_up"}
                    </span>
                    {isBad ? "Bad Habit" : "Good Habit"}
                  </span>
                  <span className="font-body text-xs text-on-surface-variant">
                    Type cannot be changed after creation
                  </span>
                </div>

                {/* Bad Habit: Daily Limit */}
                {isBad && (
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
                  </div>
                )}

                {/* Frequency */}
                <div>
                  <h3 className="font-headline text-base font-bold text-on-surface mb-3">Frequency</h3>
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

                {/* Daily Target — good habits only */}
                {!isBad && (
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

                {/* Category */}
                <div>
                  <h3 className="font-headline text-base font-bold text-on-surface mb-3">Category</h3>
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
              </>
            ) : (
              /* Icon tab */
              <IconPicker selected={icon} onSelect={setIcon} />
            )}
          </div>

          {/* Save button */}
          <div className="px-6 pb-6">
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full py-5 font-headline font-bold text-lg shadow-primary-glow hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
          <div className="bg-surface rounded-[2rem] p-7 w-full max-w-sm shadow-ambient-lg">
            <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-on-error-container">delete_forever</span>
            </div>
            <h3 className="font-headline font-bold text-xl text-on-surface text-center mb-2">
              Delete &quot;{habit.name}&quot;?
            </h3>
            <p className="font-body text-on-surface-variant text-sm text-center mb-6">
              This will remove the habit and all its history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-full bg-surface-container text-on-surface font-label font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-full bg-error text-on-error font-label font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
