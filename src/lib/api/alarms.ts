import { db } from "@/lib/db";
import { alarms } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import type { Alarm } from "@/types";

export async function getAlarms(userId: string): Promise<Alarm[]> {
  const data = await db
    .select()
    .from(alarms)
    .where(eq(alarms.userId, userId))
    .orderBy(asc(alarms.time));

  return data.map(a => ({
    ...a,
    user_id: a.userId,
    created_at: a.createdAt.toISOString(),
    updated_at: a.updatedAt.toISOString(),
  })) as unknown as Alarm[];
}

export async function upsertAlarm(
  userId: string,
  alarm: any
): Promise<Alarm> {
  let record;
  if (alarm.id) {
    [record] = await db
      .update(alarms)
      .set({
        time: alarm.time,
        label: alarm.label,
        enabled: alarm.enabled,
        updatedAt: new Date(),
      })
      .where(eq(alarms.id, alarm.id))
      .returning();
  } else {
    [record] = await db.insert(alarms).values({
      userId,
      time: alarm.time,
      label: alarm.label,
      enabled: alarm.enabled,
    }).returning();
  }

  return {
    ...record,
    user_id: record.userId,
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString(),
  } as unknown as Alarm;
}

export async function deleteAlarm(id: string): Promise<void> {
  await db.delete(alarms).where(eq(alarms.id, id));
}

export async function toggleAlarm(id: string, enabled: boolean): Promise<Alarm> {
  const [record] = await db
    .update(alarms)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(alarms.id, id))
    .returning();

  return {
    ...record,
    user_id: record.userId,
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString(),
  } as unknown as Alarm;
}
