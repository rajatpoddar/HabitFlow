/**
 * Browser Notification Utility
 * Handles permission requests, scheduling, and sending notifications.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export function sendNotification(title: string, options?: NotificationOptions): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    ...options,
  });
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

// Map of scheduled timeouts: key = unique id, value = timeout handle
const scheduledNotifications = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Schedule a daily notification at a given HH:MM time.
 * Cancels any existing notification with the same key.
 */
export function scheduleNotification(
  key: string,
  time: string, // "HH:MM"
  title: string,
  body: string
): void {
  // Cancel existing
  cancelNotification(key);

  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return;

  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If time already passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();

  const handle = setTimeout(() => {
    sendNotification(title, { body });
    // Re-schedule for next day
    scheduleNotification(key, time, title, body);
  }, delay);

  scheduledNotifications.set(key, handle);
}

export function cancelNotification(key: string): void {
  const handle = scheduledNotifications.get(key);
  if (handle !== undefined) {
    clearTimeout(handle);
    scheduledNotifications.delete(key);
  }
}

export function cancelAllNotifications(): void {
  scheduledNotifications.forEach((handle) => clearTimeout(handle));
  scheduledNotifications.clear();
}

/**
 * Schedule all habit reminders from the habits list.
 */
export function scheduleHabitReminders(
  habits: Array<{
    id: string;
    name: string;
    type: string;
    reminder_enabled: boolean;
    reminder_time?: string | null;
  }>
): void {
  habits.forEach((habit) => {
    const key = `habit_reminder_${habit.id}`;
    if (habit.reminder_enabled && habit.reminder_time) {
      const title =
        habit.type === "bad"
          ? `Stay strong 💪 — ${habit.name}`
          : `Time for: ${habit.name}`;
      const body =
        habit.type === "bad"
          ? `You've been doing great avoiding this. Keep it up!`
          : `Your daily reminder to stay consistent. You've got this!`;
      scheduleNotification(key, habit.reminder_time, title, body);
    } else {
      cancelNotification(key);
    }
  });
}

/**
 * Schedule wake-up alarms.
 */
export function scheduleAlarms(
  alarms: Array<{ id: string; time: string; label: string; enabled: boolean }>
): void {
  alarms.forEach((alarm) => {
    const key = `alarm_${alarm.id}`;
    if (alarm.enabled) {
      scheduleNotification(key, alarm.time, `⏰ ${alarm.label}`, "Time to wake up!");
    } else {
      cancelNotification(key);
    }
  });
}
