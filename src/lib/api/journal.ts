import { db } from "@/lib/db";
import { journalEntries, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { JournalEntry } from "@/types";
import { format } from "date-fns";
import { notifyFriends } from "@/lib/notifications-server";

export async function getJournalEntries(
  userId: string,
  limit = 30
): Promise<JournalEntry[]> {
  const data = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.date))
    .limit(limit);

  return data.map(e => ({
    ...e,
    user_id: e.userId,
    good_text: e.goodText,
    bad_text: e.badText,
    journal_text: e.journalText,
    is_shared: e.isShared,
    created_at: e.createdAt.toISOString(),
    updated_at: e.updatedAt.toISOString(),
  })) as unknown as JournalEntry[];
}

export async function upsertJournalEntry(
  userId: string,
  date: Date,
  data: { good_text: string; bad_text: string; journal_text: string; is_shared?: boolean }
): Promise<JournalEntry> {
  const dateStr = format(date, "yyyy-MM-dd");

  const [existing] = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.userId, userId), eq(journalEntries.date, dateStr)))
    .limit(1);

  let record;
  if (existing) {
    [record] = await db
      .update(journalEntries)
      .set({
        goodText: data.good_text,
        badText: data.bad_text,
        journalText: data.journal_text,
        isShared: data.is_shared ?? existing.isShared,
        updatedAt: new Date(),
      })
      .where(eq(journalEntries.id, existing.id))
      .returning();
  } else {
    [record] = await db.insert(journalEntries).values({
      userId,
      date: dateStr,
      goodText: data.good_text,
      badText: data.bad_text,
      journalText: data.journal_text,
      isShared: data.is_shared ?? false,
    }).returning();
  }

  // Notify friends if newly shared
  if (record.isShared && (!existing || !existing.isShared)) {
    const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId));
    const userName = user?.name || "A friend";
    
    // We don't await this so it doesn't block the request
    notifyFriends(userId, {
      title: `${userName} shared a thought`,
      body: "Tap to view their daily journal entry in your feed.",
    });
  }

  return {
    ...record,
    user_id: record.userId,
    good_text: record.goodText,
    bad_text: record.badText,
    journal_text: record.journalText,
    is_shared: record.isShared,
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString(),
  } as unknown as JournalEntry;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await db.delete(journalEntries).where(eq(journalEntries.id, id));
}
