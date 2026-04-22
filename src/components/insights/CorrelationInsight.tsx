'use client';

import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { calculateHabitCorrelations } from '@/lib/analytics/correlations';
import { subDays, format } from 'date-fns';

export default function CorrelationInsight() {
  const { habits, logs } = useStore();

  const correlations = useMemo(() => {
    // Get last 30 days of logs
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const recentLogs = logs.filter((log) => log.date >= thirtyDaysAgo);

    return calculateHabitCorrelations(recentLogs, habits);
  }, [habits, logs]);

  if (correlations.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface-container-low rounded-[1.5rem] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">link</span>
        </div>
        <div>
          <h3 className="font-headline text-lg font-bold text-on-surface">
            Habit Connections
          </h3>
          <p className="font-body text-xs text-on-surface-variant">
            Habits you often complete together
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {correlations.map((correlation, index) => (
          <div
            key={`${correlation.habit1.id}-${correlation.habit2.id}`}
            className="bg-surface-container rounded-[1rem] p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{correlation.habit1.icon}</span>
                <span className="font-label text-sm font-semibold text-on-surface">
                  {correlation.habit1.name}
                </span>
              </div>
              <span className="material-symbols-outlined text-primary">link</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{correlation.habit2.icon}</span>
                <span className="font-label text-sm font-semibold text-on-surface">
                  {correlation.habit2.name}
                </span>
              </div>
            </div>
            <p className="font-body text-sm text-on-surface-variant">
              You complete <strong className="text-on-surface">{correlation.habit1.name}</strong>{' '}
              <strong className="text-primary">{Math.round(correlation.score * 100)}%</strong> of
              days you also complete{' '}
              <strong className="text-on-surface">{correlation.habit2.name}</strong>
            </p>
          </div>
        ))}
      </div>

      <p className="font-body text-xs text-on-surface-variant mt-4 text-center">
        💡 Pairing habits can help build stronger routines
      </p>
    </div>
  );
}
