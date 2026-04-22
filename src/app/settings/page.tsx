"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useStore } from "@/store/useStore";
import BottomNav from "@/components/ui/BottomNav";
import TopBar from "@/components/ui/TopBar";
import Toggle from "@/components/ui/Toggle";
import toast from "react-hot-toast";
import * as authApi from "@/lib/api/auth";
import { changePasswordSchema } from "@/lib/validations";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
  scheduleAlarms,
  cancelAllNotifications,
  scheduleHabitReminders,
} from "@/lib/notifications";
import { calculateStreak } from "@/lib/api/habits";
import type { Alarm } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const {
    user,
    isLoading,
    checkAuth,
    logout,
    habits,
    logs,
    alarms,
    fetchHabits,
    fetchLogs,
    fetchAlarms,
    upsertAlarm,
    deleteAlarm,
    toggleAlarm,
    updateProfile,
    changePassword,
    deleteAccount,
  } = useStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [cloudSync] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Alarm form state
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [alarmTime, setAlarmTime] = useState("07:00");
  const [alarmLabel, setAlarmLabel] = useState("Wake up");
  const [isSavingAlarm, setIsSavingAlarm] = useState(false);

  useEffect(() => {
    checkAuth().then(() => {
      const { user } = useStore.getState();
      if (!user) { router.push("/login"); return; }
      setEditName(user.name || "");
      Promise.all([fetchHabits(), fetchLogs(), fetchAlarms()]);
    });

    // Check notification permission
    if (isNotificationSupported()) {
      const perm = getNotificationPermission();
      setNotifPermission(perm);
      setNotificationsEnabled(perm === "granted");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-schedule notifications whenever habits/alarms change
  useEffect(() => {
    if (notificationsEnabled && habits.length > 0) {
      scheduleHabitReminders(habits);
    }
  }, [habits, notificationsEnabled]);

  useEffect(() => {
    if (notificationsEnabled && alarms.length > 0) {
      scheduleAlarms(alarms);
    }
  }, [alarms, notificationsEnabled]);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast.error("Please allow notifications in your browser settings");
        return;
      }
      setNotificationsEnabled(true);
      setNotifPermission("granted");
      scheduleHabitReminders(habits);
      scheduleAlarms(alarms);
      toast.success("Notifications enabled 🔔");
    } else {
      setNotificationsEnabled(false);
      cancelAllNotifications();
      toast.success("Notifications disabled");
    }
  };

  const handleLogout = async () => {
    cancelAllNotifications();
    await logout();
    router.push("/");
  };

  const handleSaveProfile = async () => {
    if (!user || !editName.trim()) return;
    setIsSavingProfile(true);
    try {
      await updateProfile({ name: editName.trim() });
      setIsEditingProfile(false);
    } catch {
      // error handled in store
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: "placeholder", // Supabase doesn't require current password for updateUser
      newPassword,
      confirmNewPassword,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(newPassword);
      setShowChangePassword(false);
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      // error handled in store
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      router.push("/");
    } catch {
      // error handled in store
    }
  };

  const handleSaveAlarm = async () => {
    if (!alarmTime) return;
    setIsSavingAlarm(true);
    try {
      await upsertAlarm({ time: alarmTime, label: alarmLabel || "Wake up", enabled: true });
      setShowAlarmForm(false);
      setAlarmTime("07:00");
      setAlarmLabel("Wake up");
    } finally {
      setIsSavingAlarm(false);
    }
  };

  // ── Accurate Stats ─────────────────────────────────────────────────────────
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const totalHabits = habits.length;

  const completedToday = useMemo(() => {
    return logs.filter((l) => l.date === todayStr && l.status === "done").length;
  }, [logs, todayStr]);

  const completionRate = useMemo(() => {
    if (totalHabits === 0) return 0;
    return Math.round((completedToday / totalHabits) * 100);
  }, [completedToday, totalHabits]);

  const currentStreak = useMemo(() => {
    // Aggregate all logs across all habits to find days where at least one was done
    const allDoneLogs = logs.filter((l) => l.status === "done");
    const { current } = calculateStreak(allDoneLogs);
    return current;
  }, [logs]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-28">
      <TopBar />

      <main className="max-w-xl mx-auto px-4 pt-4 space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-headline text-4xl font-extrabold text-primary tracking-tight">
            Settings
          </h2>
          <p className="font-body text-on-surface-variant mt-1">
            Manage your conservatory.
          </p>
        </div>

        {/* Profile Card */}
        <section className="bg-surface-container-low rounded-[1.5rem] p-6">
          {isEditingProfile ? (
            <div className="space-y-4">
              <h3 className="font-headline font-bold text-on-surface">Edit Profile</h3>
              <div className="relative bg-surface-container-highest rounded-t-DEFAULT border-b-2 border-primary/20 focus-within:border-primary transition-colors">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary/60 text-xl">person</span>
                </div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-transparent border-none text-on-surface focus:ring-0 font-body outline-none"
                  placeholder="Your name"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-3 rounded-full bg-surface-container text-on-surface-variant font-label font-semibold transition-colors hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="flex-1 py-3 rounded-full bg-primary text-on-primary font-label font-semibold transition-all hover:scale-[1.02] disabled:opacity-60"
                >
                  {isSavingProfile ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-3xl">person</span>
                </div>
                <div>
                  <h3 className="font-headline text-xl font-bold text-on-surface">{user?.name || "User"}</h3>
                  <p className="font-body text-on-surface-variant text-sm">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="bg-surface-variant/40 hover:bg-surface-container text-primary font-label font-semibold px-5 py-2.5 rounded-full transition-all hover:scale-[1.02] flex items-center gap-2 border border-outline-variant/15"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit
              </button>
            </div>
          )}
        </section>

        {/* Stats Card — Fixed with real-time accurate data */}
        <section className="bg-surface-container rounded-[1.5rem] p-6">
          <h3 className="font-headline font-bold text-on-surface mb-1">Your Stats</h3>
          <p className="font-body text-xs text-on-surface-variant mb-4">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-surface-container-lowest rounded-[1.25rem] p-4 shadow-ambient">
              <span className="material-symbols-outlined text-primary text-xl">checklist</span>
              <div className="font-headline font-bold text-2xl text-on-surface mt-1">{totalHabits}</div>
              <div className="font-body text-xs text-on-surface-variant">Total Habits</div>
            </div>
            <div className="bg-surface-container-lowest rounded-[1.25rem] p-4 shadow-ambient">
              <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
              <div className="font-headline font-bold text-2xl text-on-surface mt-1">{completedToday}</div>
              <div className="font-body text-xs text-on-surface-variant">Completed Today</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-lowest rounded-[1.25rem] p-4 shadow-ambient">
              <span className="material-symbols-outlined text-primary text-xl">monitoring</span>
              <div className="font-headline font-bold text-2xl text-on-surface mt-1">{completionRate}%</div>
              <div className="font-body text-xs text-on-surface-variant">Today&apos;s Rate</div>
            </div>
            <div className="bg-surface-container-lowest rounded-[1.25rem] p-4 shadow-ambient">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_fire_department
              </span>
              <div className="font-headline font-bold text-2xl text-on-surface mt-1">{currentStreak}</div>
              <div className="font-body text-xs text-on-surface-variant">Day Streak</div>
            </div>
          </div>
          {/* Completion bar */}
          {totalHabits > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-body text-xs text-on-surface-variant">Today&apos;s progress</span>
                <span className="font-label font-semibold text-xs text-primary">{completedToday}/{totalHabits}</span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Wake-up Alarm */}
        <section className="bg-surface-container-low rounded-[1.5rem] overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">alarm</span>
                </div>
                <div>
                  <h4 className="font-headline text-base font-bold text-on-surface">Wake-up Alarms</h4>
                  <p className="font-body text-sm text-on-surface-variant">Daily morning reminders</p>
                </div>
              </div>
              <button
                onClick={() => setShowAlarmForm(!showAlarmForm)}
                className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>

            {/* Add alarm form */}
            {showAlarmForm && (
              <div className="bg-surface-container-highest rounded-[1.25rem] p-4 mb-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  <div className="flex-1">
                    <label className="font-label text-xs text-on-surface-variant block mb-1">Time</label>
                    <input
                      type="time"
                      value={alarmTime}
                      onChange={(e) => setAlarmTime(e.target.value)}
                      className="bg-transparent border-none font-headline font-bold text-on-surface text-xl focus:ring-0 outline-none w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">label</span>
                  <input
                    type="text"
                    value={alarmLabel}
                    onChange={(e) => setAlarmLabel(e.target.value)}
                    placeholder="Label (e.g., Wake up for gym)"
                    className="flex-1 bg-transparent border-none font-body text-on-surface placeholder:text-on-surface-variant/40 focus:ring-0 outline-none text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAlarmForm(false)}
                    className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface-variant font-label font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAlarm}
                    disabled={isSavingAlarm}
                    className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-label font-semibold text-sm disabled:opacity-60"
                  >
                    {isSavingAlarm ? "Saving..." : "Save Alarm"}
                  </button>
                </div>
              </div>
            )}

            {/* Alarm list */}
            {alarms.length === 0 ? (
              <p className="font-body text-sm text-on-surface-variant text-center py-3">
                No alarms set. Tap + to add one.
              </p>
            ) : (
              <div className="space-y-2">
                {alarms.map((alarm) => (
                  <AlarmRow
                    key={alarm.id}
                    alarm={alarm}
                    onToggle={(enabled) => toggleAlarm(alarm.id, enabled)}
                    onDelete={() => deleteAlarm(alarm.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-surface-container-low rounded-[1.5rem] overflow-hidden">
          <div className="p-5 flex items-center justify-between hover:bg-surface-container/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">notifications_active</span>
              </div>
              <div>
                <h4 className="font-headline text-base font-bold text-on-surface">Push Notifications</h4>
                <p className="font-body text-sm text-on-surface-variant">
                  {notifPermission === "denied"
                    ? "Blocked — enable in browser settings"
                    : "Habit reminders & alarms"}
                </p>
              </div>
            </div>
            <Toggle
              checked={notificationsEnabled}
              onChange={handleNotificationToggle}
              disabled={notifPermission === "denied"}
            />
          </div>

          <div className="h-px w-[85%] mx-auto bg-surface-variant/50" />

          <div className="p-5 flex items-center justify-between hover:bg-surface-container/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">cloud_sync</span>
              </div>
              <div>
                <h4 className="font-headline text-base font-bold text-on-surface">Cloud Sync</h4>
                <p className="font-body text-sm text-on-surface-variant">Back up across devices</p>
              </div>
            </div>
            <Toggle checked={cloudSync} onChange={() => {}} />
          </div>
        </section>

        {/* Subscription / Plan Card */}
        <SubscriptionCard plan={user?.plan ?? "free"} />

        {/* Account Actions */}
        <section className="space-y-3">
          <button
            onClick={() => router.push("/debug-pwa")}
            className="w-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-headline font-bold text-base p-5 rounded-[1.5rem] flex items-center justify-between transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">bug_report</span>
              PWA Debug Info
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>

          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-headline font-bold text-base p-5 rounded-[1.5rem] flex items-center justify-between transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">lock_reset</span>
              Change Password
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>

          {user?.plan === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="w-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-headline font-bold text-base p-5 rounded-[1.5rem] flex items-center justify-between transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                Admin Dashboard
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-headline font-bold text-base p-5 rounded-[1.5rem] flex items-center justify-between transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">logout</span>
              Sign Out
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full bg-error-container hover:bg-error/20 text-on-error-container font-headline font-bold text-base p-5 rounded-[1.5rem] flex items-center justify-between transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined">delete_forever</span>
              Delete Account
            </div>
          </button>
        </section>

        <div className="text-center pb-4">
          <p className="font-label text-xs text-on-surface-variant/50">
            HabitFlow v1.1.0 · Digital Conservatory
          </p>
        </div>
      </main>

      <BottomNav />

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
            onClick={() => setShowChangePassword(false)}
          />
          <div className="relative bg-surface rounded-[2rem] p-8 max-w-sm w-full shadow-ambient-lg animate-slide-up">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Change Password</h3>
            <div className="space-y-4">
              <div className="relative bg-surface-container-highest rounded-t-DEFAULT border-b-2 border-primary/20 focus-within:border-primary transition-colors">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  className="block w-full px-4 py-4 bg-transparent border-none text-on-surface focus:ring-0 font-body outline-none"
                />
              </div>
              <div className="relative bg-surface-container-highest rounded-t-DEFAULT border-b-2 border-primary/20 focus-within:border-primary transition-colors">
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="block w-full px-4 py-4 bg-transparent border-none text-on-surface focus:ring-0 font-body outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowChangePassword(false)}
                className="flex-1 py-3 rounded-full bg-surface-container text-on-surface font-label font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="flex-1 py-3 rounded-full bg-primary text-on-primary font-label font-semibold disabled:opacity-60"
              >
                {isChangingPassword ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-surface rounded-[2rem] p-8 max-w-sm w-full shadow-ambient-lg animate-slide-up">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-3">Delete Account?</h3>
            <p className="font-body text-on-surface-variant text-sm mb-6">
              This will permanently delete your account and all your data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-full bg-surface-container text-on-surface font-label font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3 rounded-full bg-error text-on-error font-label font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subscription Card Component ───────────────────────────────────────────────
function SubscriptionCard({ plan }: { plan: string }) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isPro = plan === "pro" || plan === "admin";

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel subscription");
      }
      toast.success("Subscription cancelled. You'll keep Pro until the end of your billing period.");
      setShowCancelConfirm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel subscription");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <section className="bg-surface-container-low rounded-[1.5rem] p-6 relative overflow-hidden">
        {isPro && (
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full blur-2xl" />
        )}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div>
            <h3 className="font-headline font-bold text-on-surface text-lg">
              Subscription
            </h3>
            <p className="font-body text-sm text-on-surface-variant mt-0.5">
              {isPro ? "Forest Pro — Active" : "Seedling — Free Plan"}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
              isPro
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-surface-container-high text-on-surface-variant"
            }`}
          >
            {isPro ? "Pro" : "Free"}
          </div>
        </div>

        {isPro ? (
          <div className="space-y-3 relative z-10">
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: "stars", label: "Unlimited habits" },
                { icon: "analytics", label: "Advanced analytics" },
                { icon: "psychology", label: "AI insights" },
                { icon: "palette", label: "Premium themes" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 bg-surface-container-highest rounded-xl px-3 py-2"
                >
                  <span className="material-symbols-outlined icon-fill text-primary text-sm">
                    {f.icon}
                  </span>
                  <span className="font-body text-xs text-on-surface">{f.label}</span>
                </div>
              ))}
            </div>
            <p className="font-body text-xs text-on-surface-variant">
              Billed monthly via Razorpay. UPI, cards & net banking accepted.
            </p>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-3 rounded-full bg-surface-container-high text-on-surface-variant font-label font-semibold text-sm hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              Cancel Subscription
            </button>
          </div>
        ) : (
          <div className="space-y-3 relative z-10">
            <p className="font-body text-sm text-on-surface-variant">
              Upgrade to Forest Pro for unlimited habits, AI insights, and
              advanced analytics.
            </p>
            <button
              onClick={() => router.push("/upgrade")}
              className="w-full py-3 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-sm shadow-[0_10px_30px_-8px_rgba(0,82,55,0.2)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined icon-fill text-sm">workspace_premium</span>
              Upgrade to Pro — ₹499/mo
            </button>
          </div>
        )}
      </section>

      {/* Cancel Confirm Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
            onClick={() => setShowCancelConfirm(false)}
          />
          <div className="relative bg-surface rounded-[2rem] p-8 max-w-sm w-full shadow-[0_40px_80px_-20px_rgba(0,82,55,0.15)]">
            <h3 className="font-headline font-bold text-xl text-on-surface mb-3">
              Cancel Pro?
            </h3>
            <p className="font-body text-on-surface-variant text-sm mb-6">
              You'll keep Forest Pro access until the end of your current billing
              period. After that, your account reverts to the free plan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 rounded-full bg-surface-container text-on-surface font-label font-semibold"
              >
                Keep Pro
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="flex-1 py-3 rounded-full bg-tertiary text-on-tertiary font-label font-semibold disabled:opacity-60"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Alarm Row Component ────────────────────────────────────────────────────────
function AlarmRow({
  alarm,
  onToggle,
  onDelete,
}: {
  alarm: Alarm;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between bg-surface-container-highest rounded-[1.25rem] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-lg">alarm</span>
        <div>
          <p className="font-headline font-bold text-on-surface text-base">{alarm.time}</p>
          <p className="font-body text-xs text-on-surface-variant">{alarm.label}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(!alarm.enabled)}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
            alarm.enabled ? "bg-primary" : "bg-surface-container-high"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              alarm.enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-tertiary hover:bg-tertiary/10 transition-all"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  );
}
