"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { useStore } from "@/store/useStore";
import BottomNav from "@/components/ui/BottomNav";
import TopBar from "@/components/ui/TopBar";
import type { JournalEntry } from "@/types";

export default function JournalPage() {
  const router = useRouter();
  const {
    user,
    isLoading,
    checkAuth,
    journalEntries,
    fetchJournalEntries,
    upsertJournalEntry,
  } = useStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goodText, setGoodText] = useState("");
  const [badText, setBadText] = useState("");
  const [journalText, setJournalText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "history">("write");

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    checkAuth().then(() => {
      const { user } = useStore.getState();
      if (!user) { router.push("/login"); return; }
      fetchJournalEntries();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load entry for selected date
  const currentEntry = useMemo(
    () => journalEntries.find((e) => e.date === selectedDateStr),
    [journalEntries, selectedDateStr]
  );

  useEffect(() => {
    if (currentEntry) {
      setGoodText(currentEntry.good_text || "");
      setBadText(currentEntry.bad_text || "");
      setJournalText(currentEntry.journal_text || "");
    } else {
      setGoodText("");
      setBadText("");
      setJournalText("");
    }
  }, [currentEntry, selectedDateStr]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await upsertJournalEntry(selectedDate, {
        good_text: goodText,
        bad_text: badText,
        journal_text: journalText,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isToday = selectedDateStr === format(new Date(), "yyyy-MM-dd");
  const hasContent = goodText.trim() || badText.trim() || journalText.trim();

  // Last 7 days for date picker
  const recentDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDateStr] // recalc only when date changes (day boundary)
  );

  return (
    <div className="min-h-screen bg-surface pb-28">
      <TopBar />

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-primary tracking-tight">
            Journal
          </h2>
          <p className="font-body text-on-surface-variant mt-1">
            Reflect on your day.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-surface-container rounded-full p-1">
          {(["write", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-full font-label font-semibold text-sm capitalize transition-all ${
                activeTab === tab
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab === "write" ? "Write" : "History"}
            </button>
          ))}
        </div>

        {activeTab === "write" ? (
          <>
            {/* Date Picker */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {recentDays.map((day) => {
                const dayStr = format(day, "yyyy-MM-dd");
                const isSelected = dayStr === selectedDateStr;
                const hasEntry = journalEntries.some((e) => e.date === dayStr);
                return (
                  <button
                    key={dayStr}
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center px-4 py-3 rounded-[1.25rem] shrink-0 transition-all ${
                      isSelected
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <span className="font-label text-xs uppercase tracking-wider">
                      {format(day, "EEE")}
                    </span>
                    <span className="font-headline font-bold text-lg mt-0.5">
                      {format(day, "d")}
                    </span>
                    {hasEntry && (
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-1 ${
                          isSelected ? "bg-on-primary/60" : "bg-primary"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Date label */}
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-on-surface">
                {isToday ? "Today" : format(selectedDate, "EEEE, MMMM d")}
              </h3>
              {currentEntry && (
                <span className="font-label text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                  Saved
                </span>
              )}
            </div>

            {/* Journal Prompts */}
            <div className="space-y-4">
              {/* Good */}
              <div className="bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-ambient">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-sm">
                      thumb_up
                    </span>
                  </div>
                  <label className="font-headline font-bold text-on-surface text-sm">
                    What good did I do today?
                  </label>
                </div>
                <textarea
                  value={goodText}
                  onChange={(e) => setGoodText(e.target.value)}
                  placeholder="Celebrate your wins, big or small..."
                  rows={3}
                  className="w-full bg-transparent border-none resize-none font-body text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 outline-none text-sm leading-relaxed"
                />
              </div>

              {/* Bad */}
              <div className="bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-ambient">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary text-sm">
                      self_improvement
                    </span>
                  </div>
                  <label className="font-headline font-bold text-on-surface text-sm">
                    What could I have done better?
                  </label>
                </div>
                <textarea
                  value={badText}
                  onChange={(e) => setBadText(e.target.value)}
                  placeholder="Reflect without judgment. Growth comes from awareness..."
                  rows={3}
                  className="w-full bg-transparent border-none resize-none font-body text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 outline-none text-sm leading-relaxed"
                />
              </div>

              {/* Free Journal */}
              <div className="bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-ambient">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-container/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container text-sm">
                      edit_note
                    </span>
                  </div>
                  <label className="font-headline font-bold text-on-surface text-sm">
                    Daily thoughts
                  </label>
                </div>
                <textarea
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="Write freely. This is your space..."
                  rows={5}
                  className="w-full bg-transparent border-none resize-none font-body text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 outline-none text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving || !hasContent}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full py-4 font-headline font-bold text-base shadow-primary-glow hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  {currentEntry ? "Update Entry" : "Save Entry"}
                </>
              )}
            </button>
          </>
        ) : (
          /* History Tab */
          <div className="space-y-4">
            {journalEntries.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">
                  edit_note
                </span>
                <p className="font-body text-on-surface-variant mt-4">
                  No journal entries yet. Start writing!
                </p>
              </div>
            ) : (
              journalEntries.map((entry) => (
                <JournalCard
                  key={entry.id}
                  entry={entry}
                  onSelect={() => {
                    setSelectedDate(new Date(entry.date + "T00:00:00"));
                    setActiveTab("write");
                  }}
                />
              ))
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function JournalCard({
  entry,
  onSelect,
}: {
  entry: JournalEntry;
  onSelect: () => void;
}) {
  const date = new Date(entry.date + "T00:00:00");
  const isToday = entry.date === format(new Date(), "yyyy-MM-dd");

  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-ambient hover:bg-surface-container-low transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-headline font-bold text-on-surface">
            {isToday ? "Today" : format(date, "EEEE, MMMM d")}
          </p>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            {format(date, "yyyy")}
          </p>
        </div>
        <div className="flex gap-1.5">
          {entry.good_text && (
            <span className="w-2 h-2 rounded-full bg-primary" title="Good" />
          )}
          {entry.bad_text && (
            <span className="w-2 h-2 rounded-full bg-tertiary" title="Reflection" />
          )}
          {entry.journal_text && (
            <span className="w-2 h-2 rounded-full bg-secondary-container" title="Journal" />
          )}
        </div>
      </div>
      {entry.journal_text && (
        <p className="font-body text-sm text-on-surface-variant line-clamp-2">
          {entry.journal_text}
        </p>
      )}
    </button>
  );
}
