"use client";

import { memo, useState } from "react";
import type { Habit, HabitLog } from "@/types";
import { useStore } from "@/store/useStore";
import { format } from "date-fns";
import { ALL_ICONS } from "./IconPicker";

interface HabitItemProps {
  habit: Habit;
  log?: HabitLog;
  date?: Date;
  onEdit?: (habit: Habit) => void;
}

function getIconValue(iconKey: string): string {
  const found = ALL_ICONS.find((i) => i.value === iconKey);
  return found ? found.value : "check_circle";
}

export default memo(function HabitItem({ habit, log, date = new Date(), onEdit }: HabitItemProps) {
  const toggleHabitLog = useStore((s) => s.toggleHabitLog);
  const updateBadHabitCount = useStore((s) => s.updateBadHabitCount);
  const [isToggling, setIsToggling] = useState(false);

  const isDone = log?.status === "done";
  const isBad = habit.type === "bad";
  const hasLimit = isBad && (habit.daily_limit ?? 0) > 0;
  const count = log?.count ?? 0;
  const limit = habit.daily_limit ?? 0;
  const avoided = hasLimit ? Math.max(0, limit - count) : 0;
  const avoidanceRate = hasLimit ? Math.round((avoided / limit) * 100) : 0;

  const handleToggle = async () => {
    if (isToggling || isBad) return; // bad habits use count buttons
    setIsToggling(true);
    try {
      await toggleHabitLog(habit.id, date);
    } finally {
      setIsToggling(false);
    }
  };

  const handleCountChange = async (delta: 1 | -1) => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await updateBadHabitCount(habit.id, date, delta);
    } finally {
      setIsToggling(false);
    }
  };

  // Supportive status message for bad habits
  const getBadHabitMessage = () => {
    if (!hasLimit) return null;
    if (count === 0) return { text: "Clean today! 🌟", color: "text-primary" };
    if (avoidanceRate >= 70) return { text: `Reduced today 👏`, color: "text-primary" };
    if (avoidanceRate >= 40) return { text: `Better than average 💪`, color: "text-secondary" };
    if (count >= limit) return { text: `At limit — you can do this!`, color: "text-tertiary" };
    return { text: `${avoided} avoided ✅`, color: "text-on-surface-variant" };
  };

  const badMsg = getBadHabitMessage();

  return (
    <div
      className={`rounded-[1.5rem] p-5 flex items-center justify-between group transition-all duration-300 habit-item ${
        isDone && !isBad
          ? "bg-surface-container-low opacity-70"
          : "bg-surface-container-lowest hover:bg-surface-container-low"
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            isDone && !isBad
              ? "bg-primary text-on-primary"
              : isBad
              ? "bg-tertiary/10 text-tertiary"
              : "bg-surface-container-low text-primary"
          }`}
        >
          <span className="material-symbols-outlined">
            {getIconValue(habit.icon)}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h4
            className={`font-headline text-base font-bold text-on-surface truncate ${
              isDone && !isBad ? "line-through decoration-outline" : ""
            }`}
          >
            {habit.name}
          </h4>

          {isBad && hasLimit ? (
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-body text-xs text-on-surface-variant">
                  {count}/{limit} today
                </span>
                {badMsg && (
                  <span className={`font-body text-xs font-medium ${badMsg.color}`}>
                    · {badMsg.text}
                  </span>
                )}
              </div>
              {/* Mini progress bar */}
              <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden w-32">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    count >= limit ? "bg-tertiary" : count > 0 ? "bg-amber-400" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(100, (count / limit) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="font-body text-xs text-on-surface-variant mt-0.5">
              {isBad ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary inline-block" />
                  Avoid • {habit.category}
                </span>
              ) : (
                `${habit.target_per_day}x daily • ${habit.category}`
              )}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-3 shrink-0">
        {onEdit && (
          <button
            onClick={() => onEdit(habit)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all"
            aria-label="Edit habit"
          >
            <span className="material-symbols-outlined text-sm">more_vert</span>
          </button>
        )}

        {/* Bad habit: count controls */}
        {isBad && hasLimit ? (
          <div className="flex items-center gap-1 bg-surface-container rounded-full p-1">
            <button
              onClick={() => handleCountChange(-1)}
              disabled={isToggling || count === 0}
              className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-high transition-all disabled:opacity-30"
              aria-label="Decrease count"
            >
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <span className="font-headline font-bold text-on-surface text-sm w-5 text-center">
              {count}
            </span>
            <button
              onClick={() => handleCountChange(1)}
              disabled={isToggling}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                count >= limit
                  ? "text-tertiary hover:bg-tertiary/10"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
              aria-label="Increase count"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
        ) : isBad ? (
          /* Bad habit without limit: simple toggle */
          <button
            onClick={handleToggle}
            disabled={isToggling}
            aria-label={isDone ? "Mark as not avoided" : "Mark as avoided"}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              isDone
                ? "bg-primary text-on-primary"
                : "border-2 border-tertiary/40 text-transparent hover:border-tertiary hover:text-tertiary"
            } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isToggling ? (
              <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                check
              </span>
            )}
          </button>
        ) : (
          /* Good habit: toggle */
          <button
            onClick={handleToggle}
            disabled={isToggling}
            aria-label={isDone ? "Mark as incomplete" : "Mark as complete"}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              isDone
                ? "bg-primary text-on-primary"
                : "border-2 border-outline-variant text-transparent hover:border-primary hover:text-primary"
            } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isToggling ? (
              <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                check
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
})
