"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import type { AdminStats, AdminUser } from "@/types";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  color = "text-blue-400",
  sub,
}: {
  label: string;
  value: number | string;
  icon: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="bg-[#1a1d27] rounded-2xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <span className={`material-symbols-outlined ${color} text-2xl`}>
          {icon}
        </span>
        {sub && (
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
            {sub}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
}

// ── User Row ──────────────────────────────────────────────────────────────────
function UserRow({
  user,
  onBan,
  onUnban,
  onDelete,
  onChangePlan,
}: {
  user: AdminUser;
  onBan: (id: string) => void;
  onUnban: (id: string) => void;
  onDelete: (id: string) => void;
  onChangePlan: (id: string, plan: string) => void;
}) {
  const planColors: Record<string, string> = {
    free: "bg-gray-700 text-gray-300",
    pro: "bg-blue-900 text-blue-300",
    admin: "bg-purple-900 text-purple-300",
  };

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {(user.name || user.email)?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div className="text-sm font-medium text-white">
              {user.name || "—"}
            </div>
            <div className="text-xs text-gray-400">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${planColors[user.plan] ?? planColors.free}`}
        >
          {user.plan}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-300">{user.habit_count}</td>
      <td className="px-4 py-3 text-sm text-gray-300">
        {user.logs_last_7_days}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">
        {user.last_sign_in_at
          ? format(new Date(user.last_sign_in_at), "MMM d, yyyy")
          : "Never"}
      </td>
      <td className="px-4 py-3">
        {user.is_banned ? (
          <span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded-full">
            Banned
          </span>
        ) : (
          <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded-full">
            Active
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {user.is_banned ? (
            <button
              onClick={() => onUnban(user.id)}
              className="text-xs px-2 py-1 rounded bg-green-900/40 text-green-400 hover:bg-green-900/70 transition-colors"
            >
              Unban
            </button>
          ) : (
            <button
              onClick={() => onBan(user.id)}
              className="text-xs px-2 py-1 rounded bg-yellow-900/40 text-yellow-400 hover:bg-yellow-900/70 transition-colors"
            >
              Ban
            </button>
          )}
          <select
            value={user.plan}
            onChange={(e) => onChangePlan(user.id, e.target.value)}
            className="text-xs bg-white/5 border border-white/10 rounded px-1 py-1 text-gray-300 focus:outline-none"
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => onDelete(user.id)}
            className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-400 hover:bg-red-900/70 transition-colors"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const { user, checkAuth } = useStore();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users">("overview");
  const [banModal, setBanModal] = useState<{ id: string } | null>(null);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    checkAuth().then(() => {
      const { user } = useStore.getState();
      if (!user || user.plan !== "admin") {
        router.push("/dashboard");
        return;
      }
      loadStats();
      loadUsers();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch {}
  };

  const loadUsers = useCallback(
    async (p = page, s = search, pf = planFilter) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: "20",
          ...(s && { search: s }),
          ...(pf && { plan: pf }),
        });
        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        setUsers(data.users ?? []);
        setTotalUsers(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      } finally {
        setIsLoading(false);
      }
    },
    [page, search, planFilter]
  );

  useEffect(() => {
    if (user?.plan === "admin") loadUsers(page, search, planFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, planFilter]);

  const handleBan = (id: string) => {
    setBanModal({ id });
    setBanReason("");
  };

  const confirmBan = async () => {
    if (!banModal) return;
    await fetch(`/api/admin/users/${banModal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ban", reason: banReason || "Violation of terms" }),
    });
    setBanModal(null);
    loadUsers();
  };

  const handleUnban = async (id: string) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unban" }),
    });
    loadUsers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user? This action cannot be undone.")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    loadUsers();
  };

  const handleChangePlan = async (id: string, plan: string) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_plan", plan }),
    });
    loadUsers();
  };

  if (!user || user.plan !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#0f1117]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-400 text-2xl">
              admin_panel_settings
            </span>
            <span className="font-headline font-bold text-xl text-white">
              HabitFlow Admin
            </span>
            <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
              Control Panel
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user.email}</span>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">
                arrow_back
              </span>
              Back to App
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Tabs */}
        <div className="flex gap-2">
          {(["overview", "users"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && stats && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Users"
                value={stats.totalUsers}
                icon="group"
                color="text-blue-400"
              />
              <StatCard
                label="Pro Users"
                value={stats.proUsers}
                icon="workspace_premium"
                color="text-yellow-400"
                sub={`${stats.totalUsers > 0 ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0}%`}
              />
              <StatCard
                label="Active (7d)"
                value={stats.activeWeekly}
                icon="trending_up"
                color="text-green-400"
              />
              <StatCard
                label="Habits Created"
                value={stats.totalHabits}
                icon="checklist"
                color="text-purple-400"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Active Today"
                value={stats.activeDaily}
                icon="today"
                color="text-cyan-400"
              />
              <StatCard
                label="Logs This Week"
                value={stats.logsThisWeek}
                icon="event_note"
                color="text-orange-400"
              />
              <StatCard
                label="Banned Users"
                value={stats.bannedUsers}
                icon="block"
                color="text-red-400"
              />
              <StatCard
                label="Free Users"
                value={stats.totalUsers - stats.proUsers}
                icon="person"
                color="text-gray-400"
              />
            </div>

            {/* Completion Trend Chart */}
            <div className="bg-[#1a1d27] rounded-2xl p-6 border border-white/5">
              <h3 className="text-white font-semibold mb-6">
                Daily Completions (Last 7 Days)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.completionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    tickFormatter={(v) => format(new Date(v + "T00:00:00"), "EEE")}
                  />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#1a1d27",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "0.75rem",
                      color: "#fff",
                    }}
                    labelFormatter={(v) =>
                      format(new Date(v + "T00:00:00"), "MMM d")
                    }
                  />
                  <Bar
                    dataKey="completions"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Categories */}
            <div className="bg-[#1a1d27] rounded-2xl p-6 border border-white/5">
              <h3 className="text-white font-semibold mb-4">
                Top Habit Categories
              </h3>
              <div className="space-y-3">
                {stats.topCategories.map((cat, i) => {
                  const max = stats.topCategories[0]?.count ?? 1;
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm w-4">{i + 1}</span>
                      <span className="text-white text-sm w-28 truncate">
                        {cat.name}
                      </span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(cat.count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-sm w-8 text-right">
                        {cat.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Users Tab ── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-[#1a1d27] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-[#1a1d27] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="admin">Admin</option>
              </select>
              <div className="text-sm text-gray-400 flex items-center">
                {totalUsers} users
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#1a1d27] rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {[
                        "User",
                        "Plan",
                        "Habits",
                        "Logs (7d)",
                        "Last Active",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-12 text-gray-500"
                        >
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <UserRow
                          key={u.id}
                          user={u}
                          onBan={handleBan}
                          onUnban={handleUnban}
                          onDelete={handleDelete}
                          onChangePlan={handleChangePlan}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">
                      chevron_left
                    </span>
                    Previous
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1"
                  >
                    Next
                    <span className="material-symbols-outlined text-sm">
                      chevron_right
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setBanModal(null)}
          />
          <div className="relative bg-[#1a1d27] rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-4">
              Ban User
            </h3>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban (optional)"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setBanModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBan}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
