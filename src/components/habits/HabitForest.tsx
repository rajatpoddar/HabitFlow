"use client";

import React from "react";
import { TreePine, TreeDeciduous, Sprout, Leaf } from "lucide-react";
import { motion } from "framer-motion";

export interface HabitForestProps {
  currentStreak: number;
  habitName: string;
  color?: string;
  isSyncing?: boolean;
}

export default function HabitForest({
  currentStreak,
  habitName,
  color = "#059669",
  isSyncing = false,
}: HabitForestProps) {
  // Visual Logic:
  // Stage 0: 0 days
  // Stage 1: 1-3 days
  // Stage 2: 4-10 days
  // Stage 3: 11+ days

  let stage = 0;
  if (currentStreak >= 11) stage = 3;
  else if (currentStreak >= 4) stage = 2;
  else if (currentStreak >= 1) stage = 1;

  const renderTree = () => {
    const props = {
      className: `transition-all duration-500 ease-in-out ${isSyncing ? "opacity-50 animate-pulse" : "opacity-100"}`,
      style: { color },
    };

    switch (stage) {
      case 3:
        return <TreePine size={64} {...props} />;
      case 2:
        return <TreeDeciduous size={48} {...props} />;
      case 1:
        return <Sprout size={32} {...props} />;
      case 0:
      default:
        return <Leaf size={24} className={`opacity-40 grayscale`} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="h-20 flex items-end justify-center"
      >
        {renderTree()}
      </motion.div>
      <div className="mt-4 text-center">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{habitName}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {currentStreak === 0
            ? "Withered - Time to water!"
            : currentStreak >= 11
            ? `Mature Tree (${currentStreak} days)`
            : currentStreak >= 4
            ? `Sapling (${currentStreak} days)`
            : `Sprout (${currentStreak} days)`}
        </p>
      </div>
      {isSyncing && (
        <span className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
          Syncing...
        </span>
      )}
    </div>
  );
}
