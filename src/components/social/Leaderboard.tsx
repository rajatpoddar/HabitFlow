"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch leaderboard");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-[1.5rem] p-6 animate-pulse">
        <div className="h-6 w-32 bg-surface-container-high rounded-full mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-surface-container-high rounded-[1.25rem]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-[1.5rem] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary icon-fill">trophy</span>
          Forest Leaders
        </h3>
      </div>

      <ul className="space-y-3">
        {leaderboard?.map((user, idx) => (
          <li
            key={user.user_id}
            className="flex items-center justify-between p-4 rounded-[1.25rem] bg-surface-container-highest transition-transform hover:scale-[1.01]"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center items-center">
                {idx === 0 ? (
                  <span className="material-symbols-outlined text-yellow-500 icon-fill text-2xl">rewarded_ads</span>
                ) : idx === 1 ? (
                  <span className="material-symbols-outlined text-slate-400 icon-fill text-xl">rewarded_ads</span>
                ) : idx === 2 ? (
                  <span className="material-symbols-outlined text-amber-700 icon-fill text-lg">rewarded_ads</span>
                ) : (
                  <span className="font-headline font-bold text-on-surface-variant text-sm">{idx + 1}</span>
                )}
              </div>
              <div>
                <p className="font-headline font-bold text-on-surface text-sm">{user.name}</p>
                <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-wider">Health Rank</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-headline font-black text-primary text-xl">
                {user.total_forest_health}
              </span>
              <span className="font-body text-[10px] text-on-surface-variant">Forest Health</span>
            </div>
          </li>
        ))}

        {(!leaderboard || leaderboard.length === 0) && (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-5xl mb-2">person_search</span>
            <p className="font-body text-sm text-on-surface-variant px-4">
              Your forest is quiet. Add friends to see how they&apos;re growing!
            </p>
          </div>
        )}
      </ul>
    </div>
  );
}
