"use client";

import Link from "next/link";
import { useStore } from "@/store/useStore";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function TopBar({
  title = "HabitFlow",
  showBack = false,
  onBack,
  rightAction,
}: TopBarProps) {
  const user = useStore((s) => s.user);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-[#f7faf5]/80 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <span className="material-symbols-outlined icon-fill text-primary text-2xl">
            potted_plant
          </span>
        )}
        <h1 className="font-headline font-black text-xl tracking-tight text-primary">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {rightAction}
        {user && (
          <Link href="/settings">
            <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                person
              </span>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
