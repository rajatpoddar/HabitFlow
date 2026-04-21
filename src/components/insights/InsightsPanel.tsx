"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import type { InsightItem } from "@/types";

const insightConfig: Record<
  InsightItem["type"],
  { bg: string; border: string; iconColor: string; badge: string }
> = {
  positive: {
    bg: "bg-emerald-50",
    border: "border-emerald-200/60",
    iconColor: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  achievement: {
    bg: "bg-amber-50",
    border: "border-amber-200/60",
    iconColor: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },
  warning: {
    bg: "bg-orange-50",
    border: "border-orange-200/60",
    iconColor: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200/60",
    iconColor: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
  },
};

function InsightCard({ insight }: { insight: InsightItem }) {
  const cfg = insightConfig[insight.type];
  return (
    <div
      className={`${cfg.bg} border ${cfg.border} rounded-[1.25rem] p-5 flex gap-4`}
    >
      <div
        className={`w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shrink-0 ${cfg.iconColor}`}
      >
        <span className="material-symbols-outlined text-xl">{insight.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-headline font-bold text-on-surface text-sm leading-tight">
            {insight.title}
          </h4>
          {insight.metric && (
            <span
              className={`text-xs font-label font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}
            >
              {insight.metric}
            </span>
          )}
        </div>
        <p className="font-body text-xs text-on-surface-variant leading-relaxed">
          {insight.description}
        </p>
      </div>
    </div>
  );
}

export default function InsightsPanel() {
  const { insights, insightsSummary, insightsLoading, fetchInsights, isPro } =
    useStore();

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (insightsLoading) {
    return (
      <div className="bg-surface-container-low rounded-[1.5rem] p-6 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">
            psychology
          </span>
          <h3 className="font-headline font-bold text-on-surface">
            AI Insights
          </h3>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-surface-container rounded-[1rem] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-surface-container-low rounded-[1.5rem] p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">
            psychology
          </span>
          <h3 className="font-headline font-bold text-on-surface">
            AI Insights
          </h3>
        </div>
        <div className="text-center py-6">
          <span className="material-symbols-outlined text-on-surface-variant text-4xl">
            insights
          </span>
          <p className="font-body text-on-surface-variant text-sm mt-2">
            Keep tracking your habits to unlock personalized insights!
          </p>
          <p className="font-body text-xs text-on-surface-variant/60 mt-1">
            Insights are generated after a few days of data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-[1.5rem] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            psychology
          </span>
          <h3 className="font-headline font-bold text-on-surface">
            AI Insights
          </h3>
        </div>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-label font-medium">
          This Week
        </span>
      </div>

      {insightsSummary && (
        <p className="font-body text-sm text-on-surface-variant bg-surface-container rounded-xl px-4 py-3">
          {insightsSummary}
        </p>
      )}

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </div>

      <p className="text-xs text-on-surface-variant/50 text-center font-body">
        Insights refresh weekly based on your habit data
      </p>
    </div>
  );
}
