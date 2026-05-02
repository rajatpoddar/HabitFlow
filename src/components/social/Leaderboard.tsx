"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Award } from "lucide-react";

export interface LeaderboardUser {
  user_id: string;
  name: string;
  total_forest_health: number;
}

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<LeaderboardUser[]> => {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });

  if (isLoading) return <div className="p-4 text-center text-sm text-gray-500 animate-pulse">Loading Leaderboard...</div>;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 max-w-md w-full">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
        <Trophy className="text-yellow-500" size={20} />
        Habit Forest Leaderboard
      </h3>
      <ul className="space-y-3">
        {leaderboard?.map((user, idx) => (
          <li key={user.user_id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-400 w-5 text-center">
                {idx === 0 ? <Medal size={20} className="text-yellow-500" /> : idx === 1 ? <Medal size={20} className="text-gray-400" /> : idx === 2 ? <Award size={20} className="text-amber-600" /> : idx + 1}
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{user.total_forest_health}</span>
              <span className="text-xs text-gray-500">score</span>
            </div>
          </li>
        ))}
        {(!leaderboard || leaderboard.length === 0) && (
          <li className="text-center text-sm text-gray-500 py-4">No friends on the leaderboard yet. Invite some!</li>
        )}
      </ul>
    </div>
  );
}
