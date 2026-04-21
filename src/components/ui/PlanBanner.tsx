"use client";

import { useStore } from "@/store/useStore";

const FREE_HABIT_LIMIT = 5;

export default function PlanBanner() {
  const { user, habits } = useStore();

  if (!user || user.plan !== "free") return null;

  const used = habits.length;
  const remaining = FREE_HABIT_LIMIT - used;

  if (remaining > 1) return null; // Only show when close to limit

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-[1.25rem] p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-amber-600 text-xl">
          workspace_premium
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-headline font-bold text-on-surface text-sm">
          {remaining === 0
            ? "You've reached the free plan limit"
            : `${remaining} habit slot remaining`}
        </p>
        <p className="font-body text-xs text-on-surface-variant mt-0.5">
          Upgrade to Pro for unlimited habits, advanced analytics, and AI
          insights.
        </p>
      </div>
      <button
        onClick={() => window.location.href = "/upgrade"}
        className="shrink-0 bg-amber-500 text-white font-label font-semibold text-xs px-4 py-2 rounded-full hover:bg-amber-600 transition-colors"
      >
        Upgrade
      </button>
    </div>
  );
}
