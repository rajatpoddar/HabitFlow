import type { Habit, HabitLog } from '@/types';

export interface CorrelationPair {
  habit1: Habit;
  habit2: Habit;
  score: number;
  description: string;
}

/**
 * Calculate habit correlations based on completion patterns
 * Algorithm: for each pair, count(both completed) / count(either completed) = score
 */
export function calculateHabitCorrelations(
  completions: HabitLog[],
  habits: Habit[]
): CorrelationPair[] {
  if (habits.length < 2 || completions.length === 0) {
    return [];
  }

  // Group completions by date
  const completionsByDate = completions.reduce((acc, log) => {
    if (log.status === 'done') {
      if (!acc[log.date]) {
        acc[log.date] = new Set<string>();
      }
      acc[log.date].add(log.habit_id);
    }
    return acc;
  }, {} as Record<string, Set<string>>);

  const dates = Object.keys(completionsByDate);
  if (dates.length < 7) {
    // Need at least 7 days of data for meaningful correlations
    return [];
  }

  const correlations: CorrelationPair[] = [];

  // Calculate correlation for each pair of habits
  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const habit1 = habits[i];
      const habit2 = habits[j];

      let bothCompleted = 0;
      let eitherCompleted = 0;

      for (const date of dates) {
        const completedHabits = completionsByDate[date];
        const has1 = completedHabits.has(habit1.id);
        const has2 = completedHabits.has(habit2.id);

        if (has1 && has2) {
          bothCompleted++;
          eitherCompleted++;
        } else if (has1 || has2) {
          eitherCompleted++;
        }
      }

      if (eitherCompleted > 0) {
        const score = bothCompleted / eitherCompleted;

        // Only include correlations with score > 0.7 (70% correlation)
        if (score >= 0.7 && bothCompleted >= 5) {
          const percentage = Math.round(score * 100);
          correlations.push({
            habit1,
            habit2,
            score,
            description: `You complete **${habit1.name}** ${percentage}% of days you also complete **${habit2.name}** 🔗`,
          });
        }
      }
    }
  }

  // Sort by score descending and return top 3
  return correlations.sort((a, b) => b.score - a.score).slice(0, 3);
}
