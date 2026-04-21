import { supabase } from "@/lib/supabase";
import type { Alarm } from "@/types";

export async function getAlarms(userId: string): Promise<Alarm[]> {
  const { data, error } = await supabase
    .from("alarms")
    .select("*")
    .eq("user_id", userId)
    .order("time", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as Alarm[];
}

export async function upsertAlarm(
  userId: string,
  alarm: Partial<Alarm> & { time: string; label: string; enabled: boolean; user_id: string }
): Promise<Alarm> {
  const { data, error } = await supabase
    .from("alarms")
    .upsert(alarm, { onConflict: alarm.id ? "id" : undefined })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Alarm;
}

export async function deleteAlarm(id: string): Promise<void> {
  const { error } = await supabase.from("alarms").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleAlarm(id: string, enabled: boolean): Promise<Alarm> {
  const { data, error } = await supabase
    .from("alarms")
    .update({ enabled })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Alarm;
}
