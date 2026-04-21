"use client";

import { useState, useMemo } from "react";

export interface IconOption {
  value: string;
  label: string;
  category: string;
  emoji: string;
}

export const ICON_CATEGORIES: Record<string, IconOption[]> = {
  Health: [
    { value: "water_drop", label: "Water", category: "Health", emoji: "💧" },
    { value: "bedtime", label: "Sleep", category: "Health", emoji: "😴" },
    { value: "restaurant", label: "Nutrition", category: "Health", emoji: "🥗" },
    { value: "favorite", label: "Heart Health", category: "Health", emoji: "❤️" },
    { value: "medication", label: "Medication", category: "Health", emoji: "💊" },
    { value: "spa", label: "Wellness", category: "Health", emoji: "🌿" },
  ],
  Fitness: [
    { value: "fitness_center", label: "Gym", category: "Fitness", emoji: "🏋️" },
    { value: "directions_run", label: "Running", category: "Fitness", emoji: "🏃" },
    { value: "directions_bike", label: "Cycling", category: "Fitness", emoji: "🚴" },
    { value: "pool", label: "Swimming", category: "Fitness", emoji: "🏊" },
    { value: "sports_martial_arts", label: "Martial Arts", category: "Fitness", emoji: "🥋" },
    { value: "hiking", label: "Hiking", category: "Fitness", emoji: "🥾" },
  ],
  "Mental Health": [
    { value: "self_improvement", label: "Meditation", category: "Mental Health", emoji: "🧘" },
    { value: "psychology", label: "Mindfulness", category: "Mental Health", emoji: "🧠" },
    { value: "sentiment_satisfied", label: "Gratitude", category: "Mental Health", emoji: "🙏" },
    { value: "air", label: "Breathing", category: "Mental Health", emoji: "🌬️" },
    { value: "mood", label: "Mood", category: "Mental Health", emoji: "😊" },
    { value: "nights_stay", label: "Rest", category: "Mental Health", emoji: "🌙" },
  ],
  Productivity: [
    { value: "menu_book", label: "Reading", category: "Productivity", emoji: "📚" },
    { value: "edit_note", label: "Journaling", category: "Productivity", emoji: "📝" },
    { value: "school", label: "Study", category: "Productivity", emoji: "📖" },
    { value: "code", label: "Coding", category: "Productivity", emoji: "💻" },
    { value: "task_alt", label: "Tasks", category: "Productivity", emoji: "✅" },
    { value: "schedule", label: "Planning", category: "Productivity", emoji: "📅" },
  ],
  Addiction: [
    { value: "smoking_rooms", label: "Smoking", category: "Addiction", emoji: "🚬" },
    { value: "no_drinks", label: "Alcohol", category: "Addiction", emoji: "🍺" },
    { value: "phone_disabled", label: "Phone", category: "Addiction", emoji: "📱" },
    { value: "no_food", label: "Junk Food", category: "Addiction", emoji: "🍔" },
    { value: "sports_esports", label: "Gaming", category: "Addiction", emoji: "🎮" },
    { value: "tv_off", label: "TV", category: "Addiction", emoji: "📺" },
  ],
  Social: [
    { value: "people", label: "Social", category: "Social", emoji: "👥" },
    { value: "volunteer_activism", label: "Volunteering", category: "Social", emoji: "🤝" },
    { value: "call", label: "Family Call", category: "Social", emoji: "📞" },
    { value: "diversity_3", label: "Community", category: "Social", emoji: "🌍" },
  ],
  Finance: [
    { value: "savings", label: "Saving", category: "Finance", emoji: "💰" },
    { value: "account_balance", label: "Budget", category: "Finance", emoji: "🏦" },
    { value: "trending_up", label: "Investing", category: "Finance", emoji: "📈" },
    { value: "receipt_long", label: "Expenses", category: "Finance", emoji: "🧾" },
  ],
};

// Flat list for search
export const ALL_ICONS: IconOption[] = Object.values(ICON_CATEGORIES).flat();

interface IconPickerProps {
  selected: string;
  onSelect: (value: string) => void;
}

export default function IconPicker({ selected, onSelect }: IconPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Health");

  const filteredIcons = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return ALL_ICONS.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.emoji.includes(q)
      );
    }
    return ICON_CATEGORIES[activeCategory] || [];
  }, [search, activeCategory]);

  const selectedIcon = ALL_ICONS.find((i) => i.value === selected);

  return (
    <div className="space-y-4">
      {/* Selected preview */}
      {selectedIcon && (
        <div className="flex items-center gap-3 bg-surface-container-low rounded-[1.25rem] p-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shrink-0">
            <span className="material-symbols-outlined text-xl">{selectedIcon.value}</span>
          </div>
          <div>
            <p className="font-label font-semibold text-on-surface text-sm">
              {selectedIcon.emoji} {selectedIcon.label}
            </p>
            <p className="font-body text-xs text-on-surface-variant">{selectedIcon.category}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons..."
          className="w-full bg-surface-container-highest rounded-full pl-10 pr-4 py-2.5 text-sm font-body text-on-surface placeholder:text-on-surface-variant/50 border-none focus:ring-0 outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Category tabs — only show when not searching */}
      {!search && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {Object.keys(ICON_CATEGORIES).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-label text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeCategory === cat
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Icon grid */}
      <div className="grid grid-cols-6 gap-2">
        {filteredIcons.map((icon) => (
          <button
            key={icon.value}
            type="button"
            onClick={() => onSelect(icon.value)}
            title={`${icon.emoji} ${icon.label}`}
            className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              selected === icon.value
                ? "bg-primary text-on-primary shadow-primary-glow scale-105"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:scale-105"
            }`}
          >
            <span className="material-symbols-outlined text-lg leading-none">{icon.value}</span>
            <span className="font-label text-[9px] leading-none opacity-70 truncate w-full text-center px-0.5">
              {icon.label}
            </span>
          </button>
        ))}
        {filteredIcons.length === 0 && (
          <div className="col-span-6 text-center py-6 text-on-surface-variant font-body text-sm">
            No icons found for &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
