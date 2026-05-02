import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleHabitLog } from "@/lib/api/habits";
import { HabitLog, LogStatus } from "@/types";
import { format } from "date-fns";

export function useHabitToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      habitId,
      date,
      currentStatus,
    }: {
      habitId: string;
      date: Date;
      currentStatus: LogStatus | null;
    }) => toggleHabitLog(habitId, date, currentStatus),
    
    // When mutate is called:
    onMutate: async ({ habitId, date, currentStatus }) => {
      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["habitLogs"] });

      // 2. Snapshot the previous value
      const previousLogs = queryClient.getQueryData<HabitLog[]>(["habitLogs"]);

      // 3. Optimistically update to the new value
      const dateStr = format(date, "yyyy-MM-dd");

      queryClient.setQueryData<HabitLog[]>(["habitLogs"], (old) => {
        if (!old) return [];
        
        const existingLogIndex = old.findIndex(
          (log) => log.habit_id === habitId && log.date === dateStr
        );

        if (existingLogIndex >= 0) {
          // If the log exists and was 'done', toggling it typically deletes it in the backend
          if (currentStatus === "done") {
             return old.filter((_, idx) => idx !== existingLogIndex);
          } else {
             const updated = [...old];
             updated[existingLogIndex] = { ...updated[existingLogIndex], status: "done" };
             return updated;
          }
        } else {
          // It doesn't exist, so optimistically add it as "done"
          return [
            ...old,
            {
              id: `optimistic-${Date.now()}`,
              habit_id: habitId,
              date: dateStr,
              status: "done",
              count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];
        }
      });

      // 4. Return context object with the snapshotted value
      return { previousLogs };
    },
    
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData(["habitLogs"], context.previousLogs);
      }
    },
    
    // Always refetch after error or success to ensure data consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["habitLogs"] });
      // You might also want to invalidate related queries, like 'habits' or 'stats'
      queryClient.invalidateQueries({ queryKey: ["socialStats"] });
    },
  });
}
