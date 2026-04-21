import { supabase } from "@/lib/supabase";
import type { JournalEntry } from "@/types";
import { format } from "date-fns";

export async function getJournalEntries(
  userId: string,
  limit = 30
): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data || []) as JournalEntry[];
}

export async function upsertJournalEntry(
  userId: string,
  date: Date,
  data: { good_text: string; bad_text: string; journal_text: string }
): Promise<JournalEntry> {
  const dateStr = format(date, "yyyy-MM-dd");

  const { data: record, error } = await supabase
    .from("journal_entries")
    .upsert(
      { user_id: userId, date: dateStr, ...data },
      { onConflict: "user_id,date" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return record as JournalEntry;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
